using Microsoft.EntityFrameworkCore;
using Models.Models;
using Repository.Interfaces;

namespace Repository.Repositories
{
    public class RoomRepository(ApplicationDbContext context) : IRoomRepository
    {
        // Rooms owned by this organization, via Room -> Restaurant -> Organization.
        private IQueryable<Room> ScopedTo(Guid organizationId) =>
            context.Rooms.Where(r => r.Restaurant!.OrganizationId == organizationId);

        public async Task<IEnumerable<Room>> GetAllAsync(Guid organizationId, Guid? restaurantId = null)
        {
            var query = ScopedTo(organizationId);

            if (restaurantId.HasValue)
                query = query.Where(r => r.RestaurantId == restaurantId.Value);

            return await query
                .Include(r => r.FloorPlan)
                    .ThenInclude(fp => fp!.Shapes)
                .OrderBy(r => r.Name)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Room?> GetByIdAsync(Guid id, Guid organizationId)
        {
            // Tracked on purpose: the service mutates the returned entity and calls UpdateAsync.
            return await ScopedTo(organizationId)
                .Include(r => r.FloorPlan)
                    .ThenInclude(fp => fp!.Shapes)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<Room> CreateAsync(Room room)
        {
            context.Rooms.Add(room);
            await context.SaveChangesAsync();
            return room;
        }

        public async Task<Room> UpdateAsync(Room room)
        {
            await context.SaveChangesAsync();
            return room;
        }

        public async Task<bool> DeleteAsync(Room room)
        {
            context.Rooms.Remove(room);
            await context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RestaurantBelongsToOrganizationAsync(Guid restaurantId, Guid organizationId)
        {
            return await context.Restaurants
                .AnyAsync(r => r.Id == restaurantId && r.OrganizationId == organizationId);
        }

        public async Task<bool> HasReservationsAsync(Guid roomId)
        {
            // Reservation -> Table -> FloorPlan -> Room
            return await context.Reservations
                .AnyAsync(res => !res.IsDeleted
                    && res.Table != null
                    && res.Table.FloorPlan!.RoomId == roomId);
        }
    }
}
