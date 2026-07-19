using Microsoft.EntityFrameworkCore;
using Models.Models;
using Repository.Interfaces;

namespace Repository.Repositories
{
    public class AuthRepository(ApplicationDbContext context) : IAuthRepository
    {
        public async Task<bool> EmailExistsAsync(string email)
        {
            return await context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task<User> RegisterAsync(Organization organization, User user)
        {
            context.Organizations.Add(organization);
            context.Users.Add(user);
            await context.SaveChangesAsync();
            return user;
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await context.Users
                .Include(u => u.Organization)
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetByRefreshTokenHashAsync(string refreshTokenHash)
        {
            return await context.Users
                .Include(u => u.Organization)
                .FirstOrDefaultAsync(u => u.RefreshTokenHash == refreshTokenHash);
        }

        public async Task<User?> GetByIdAsync(Guid id)
        {
            return await context.Users.FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<User> AddUserAsync(User user)
        {
            context.Users.Add(user);
            await context.SaveChangesAsync();
            return user;
        }

        public async Task<IReadOnlyList<User>> GetTeamAsync(Guid organizationId)
        {
            return await context.Users
                .Where(u => u.OrganizationId == organizationId)
                .OrderBy(u => u.CreatedAt)
                .AsNoTracking()
                .ToListAsync();
        }

        public Task SaveAsync() => context.SaveChangesAsync();
    }
}
