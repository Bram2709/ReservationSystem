using Models.DTOs;
using Models.Models;

namespace Service.Interface
{
    /// <summary>Login/refresh result: the JWT payload for the client plus the raw refresh
    /// token the controller puts in an httpOnly cookie (only the hash is stored).</summary>
    public record AuthResult(UserWithJwtTokenDTO User, string RefreshToken);

    public interface IAuthService
    {
        Task<User> RegisterAsync(RegisterNewTenantRequestDTO request);

        Task<AuthResult?> LoginAsync(LoginRequestDTO request);

        // Null when the refresh token is unknown or expired. Rotates the token.
        Task<AuthResult?> RefreshAsync(string refreshToken);

        Task LogoutAsync(string refreshToken);

        // Always succeeds from the caller's perspective (no account enumeration).
        Task ForgotPasswordAsync(string email);

        Task<bool> ResetPasswordAsync(ResetPasswordRequestDTO request);

        Task<IReadOnlyList<TeamMemberDTO>> GetTeamAsync(Guid organizationId);

        // Null when the email is already in use.
        Task<StaffCreatedDTO?> CreateStaffAsync(Guid organizationId, string email);

        Task<bool> RemoveStaffAsync(Guid organizationId, Guid userId, Guid callerUserId);
    }
}
