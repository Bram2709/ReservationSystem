using Models.Models;

namespace Repository.Interfaces
{
    public interface IAuthRepository
    {
        Task<bool> EmailExistsAsync(string email);
        Task<User> RegisterAsync(Organization organization, User user);
        Task<User?> GetByEmailAsync(string email);
    }
}

