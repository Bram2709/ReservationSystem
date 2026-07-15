using Microsoft.EntityFrameworkCore;
using Models.Models;
using Repository.Interfaces;

namespace Repository.Repositories
{
    public class RestaurantRepository(ApplicationDbContext context) : IRestaurantRepository
    {
        public async Task<IEnumerable<Restaurant>> GetAllRestaurantsFromUserAsync(Guid organizationId)
        {
            return await context.Restaurants
                .Where(r => r.OrganizationId == organizationId)
                .Include(r => r.Rooms)
                    .ThenInclude(room => room.FloorPlan)
                        .ThenInclude(fp => fp!.Shapes)
                .OrderBy(r => r.Name)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Restaurant?> GetByIdAsync(Guid id, Guid organizationId)
        {
            return await context.Restaurants
                .Include(r => r.Rooms)
                    .ThenInclude(room => room.FloorPlan)
                        .ThenInclude(fp => fp!.Shapes)
                .FirstOrDefaultAsync(r => r.Id == id && r.OrganizationId == organizationId);
        }

        public async Task<Restaurant> CreateAsync(Restaurant restaurant)
        {
            context.Restaurants.Add(restaurant);
            await context.SaveChangesAsync();
            return restaurant;
        }

        public async Task<Restaurant> UpdateAsync(Restaurant restaurant)
        {
            await context.SaveChangesAsync();
            return restaurant;
        }

        public async Task<bool> DeleteAsync(Restaurant restaurant)
        {
            context.Restaurants.Remove(restaurant);
            await context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> HasRoomsAsync(Guid restaurantId)
        {
            return await context.Rooms.AnyAsync(r => r.RestaurantId == restaurantId);
        }

        public async Task<bool> HasReservationsAsync(Guid restaurantId)
        {
            return await context.Reservations
                .AnyAsync(r => r.RestaurantId == restaurantId && !r.IsDeleted);
        }
    }
}
