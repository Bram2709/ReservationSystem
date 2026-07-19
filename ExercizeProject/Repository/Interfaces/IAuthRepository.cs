using Models.Models;

namespace Repository.Interfaces
{
    public interface IAuthRepository
    {
        Task<bool> EmailExistsAsync(string email);
        Task<User> RegisterAsync(Organization organization, User user);
        Task<User?> GetByEmailAsync(string email);

        Task<User?> GetByRefreshTokenHashAsync(string refreshTokenHash);

        Task<User?> GetByIdAsync(Guid id);

        Task<User> AddUserAsync(User user);

        Task<IReadOnlyList<User>> GetTeamAsync(Guid organizationId);

        // Persists changes to already-tracked users (token rotation, password reset, etc.).
        Task SaveAsync();
    }
}
