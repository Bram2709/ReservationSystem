using Models.DTOs;
using Models.Models;
using Repository.Interfaces;
using Service.Interface;

namespace Service.Services
{
    public class AuthService(IAuthRepository authRepository, ITokenService tokenService) : IAuthService
    {
        //DOESNT RETURN A TOKEN AFTER REGISTRATION 
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
                //check if i want to use this hash
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Organization = organization
            };

            return await authRepository.RegisterAsync(organization, user);
        }

        public async Task<UserWithJwtTokenDTO?> LoginAsync(LoginRequestDTO request)
        {
            var user = await authRepository.GetByEmailAsync(request.Email);

            if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return null;
            }

            string token = tokenService.GenerateJwtToken(user);

            UserWithJwtTokenDTO userWithJwtTokenDTO = new()
            {
                Id = user.Id,
                Email = user.Email,
                Role = user.Role,
                JwtToken = token
            };

            return userWithJwtTokenDTO;
        }
    }
}
