using Models.DTOs;
using Models.Models;

namespace Service.Interface
{
    public interface IAuthService
    {
        Task<User> RegisterAsync(RegisterNewTenantRequestDTO request);
        Task<UserWithJwtTokenDTO?> LoginAsync(LoginRequestDTO request);
    }
}
