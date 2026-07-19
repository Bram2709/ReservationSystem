using Microsoft.Extensions.Configuration;
using Models.DTOs;
using Models.Enums;
using Models.Models;
using Repository.Interfaces;
using Service.Interface;
using System.Security.Cryptography;
using System.Text;

namespace Service.Services
{
    public class AuthService(
        IAuthRepository authRepository,
        ITokenService tokenService,
        IEmailSender emailSender,
        IConfiguration config) : IAuthService
    {
        private const int RefreshTokenDays = 14;
        private const int ResetTokenMinutes = 60;

        public async Task<User> RegisterAsync(RegisterNewTenantRequestDTO request)
        {
            if (await authRepository.EmailExistsAsync(request.OwnerEmail))
            {
                throw new InvalidOperationException("An account with this email already exists.");
            }

            var organization = new Organization
            {
                Name = request.OrganizationName,
                CreatedAt = DateTime.UtcNow
            };

            var user = new User
            {
                Email = request.OwnerEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = OrganizationRole.Owner,
                Organization = organization
            };

            var created = await authRepository.RegisterAsync(organization, user);

            _ = emailSender.SendAsync(
                user.Email,
                $"Welcome to Aura Reserve, {organization.Name}!",
                $"Your organization \"{organization.Name}\" is set up.\n\n" +
                "Next steps: create a restaurant, add rooms, draw the floorplan, and start taking reservations.");

            return created;
        }

        public async Task<AuthResult?> LoginAsync(LoginRequestDTO request)
        {
            var user = await authRepository.GetByEmailAsync(request.Email);

            if (user is null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return null;
            }

            return await IssueTokensAsync(user);
        }

        public async Task<AuthResult?> RefreshAsync(string refreshToken)
        {
            var user = await authRepository.GetByRefreshTokenHashAsync(Sha256(refreshToken));

            if (user is null || !user.IsActive ||
                user.RefreshTokenExpiresAt is null || user.RefreshTokenExpiresAt < DateTime.UtcNow)
            {
                return null;
            }

            // Rotation: every refresh invalidates the previous token.
            return await IssueTokensAsync(user);
        }

        public async Task LogoutAsync(string refreshToken)
        {
            var user = await authRepository.GetByRefreshTokenHashAsync(Sha256(refreshToken));
            if (user is null) return;

            user.RefreshTokenHash = null;
            user.RefreshTokenExpiresAt = null;
            await authRepository.SaveAsync();
        }

        public async Task ForgotPasswordAsync(string email)
        {
            var user = await authRepository.GetByEmailAsync(email);
            if (user is null) return; // silent: no account enumeration

            var token = RandomToken();
            user.PasswordResetTokenHash = Sha256(token);
            user.PasswordResetExpiresAt = DateTime.UtcNow.AddMinutes(ResetTokenMinutes);
            await authRepository.SaveAsync();

            var baseUrl = config["Frontend:BaseUrl"] ?? "http://localhost:5173";
            var link = $"{baseUrl}/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

            _ = emailSender.SendAsync(
                email,
                "Reset your Aura Reserve password",
                $"A password reset was requested for this account.\n\nReset link (valid for {ResetTokenMinutes} minutes):\n{link}\n\n" +
                "If you didn't request this, you can ignore this email.");
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordRequestDTO request)
        {
            var user = await authRepository.GetByEmailAsync(request.Email);

            if (user is null ||
                user.PasswordResetTokenHash is null ||
                user.PasswordResetExpiresAt is null ||
                user.PasswordResetExpiresAt < DateTime.UtcNow ||
                user.PasswordResetTokenHash != Sha256(request.Token))
            {
                return false;
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordResetTokenHash = null;
            user.PasswordResetExpiresAt = null;
            // Kill existing sessions: the old refresh token dies with the old password.
            user.RefreshTokenHash = null;
            user.RefreshTokenExpiresAt = null;
            await authRepository.SaveAsync();
            return true;
        }

        public async Task<IReadOnlyList<TeamMemberDTO>> GetTeamAsync(Guid organizationId)
        {
            var users = await authRepository.GetTeamAsync(organizationId);
            return users.Select(u => new TeamMemberDTO
            {
                Id = u.Id,
                Email = u.Email,
                Role = u.Role,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            }).ToList();
        }

        public async Task<StaffCreatedDTO?> CreateStaffAsync(Guid organizationId, string email)
        {
            if (await authRepository.EmailExistsAsync(email))
                return null;

            var tempPassword = RandomToken()[..12];

            var user = new User
            {
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                Role = OrganizationRole.Member,
                OrganizationId = organizationId
            };

            var created = await authRepository.AddUserAsync(user);

            var baseUrl = config["Frontend:BaseUrl"] ?? "http://localhost:5173";
            _ = emailSender.SendAsync(
                email,
                "You've been added to a team on Aura Reserve",
                $"An account was created for you.\n\nLogin: {baseUrl}/login\nEmail: {email}\nTemporary password: {tempPassword}\n\n" +
                "Use 'Forgot your password?' to set your own password.");

            return new StaffCreatedDTO { Id = created.Id, Email = created.Email, TempPassword = tempPassword };
        }

        public async Task<bool> RemoveStaffAsync(Guid organizationId, Guid userId, Guid callerUserId)
        {
            if (userId == callerUserId) return false; // owners cannot remove themselves

            var user = await authRepository.GetByIdAsync(userId);
            if (user is null || user.OrganizationId != organizationId || user.Role == OrganizationRole.Owner)
                return false;

            user.IsActive = false; // deactivate rather than hard-delete: history stays intact
            user.RefreshTokenHash = null;
            user.RefreshTokenExpiresAt = null;
            await authRepository.SaveAsync();
            return true;
        }

        private async Task<AuthResult> IssueTokensAsync(User user)
        {
            var refreshToken = RandomToken();
            user.RefreshTokenHash = Sha256(refreshToken);
            user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenDays);
            await authRepository.SaveAsync();

            var dto = new UserWithJwtTokenDTO
            {
                Id = user.Id,
                Email = user.Email,
                Role = user.Role,
                JwtToken = tokenService.GenerateJwtToken(user)
            };

            return new AuthResult(dto, refreshToken);
        }

        private static string RandomToken() =>
            Convert.ToBase64String(RandomNumberGenerator.GetBytes(48))
                .Replace("+", "-").Replace("/", "_").TrimEnd('=');

        private static string Sha256(string value) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    }
}
