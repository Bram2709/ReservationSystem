using Models.Models;

namespace Repository.Interfaces
{
    public interface IRoomRepository
    {
        // Reads are scoped to an organization: a room belongs to one through its Restaurant.
        Task<IEnumerable<Room>> GetAllAsync(Guid organizationId, Guid? restaurantId = null);

        Task<Room?> GetByIdAsync(Guid id, Guid organizationId);

        Task<Room> CreateAsync(Room room);

        // Persists an entity already tracked by the current context.
        Task<Room> UpdateAsync(Room room);

        Task<bool> DeleteAsync(Room room);

        Task<bool> RestaurantBelongsToOrganizationAsync(Guid restaurantId, Guid organizationId);

        // Guards a delete that would cascade the room's floorplan and tables away while
        // reservations still point at those tables.
        Task<bool> HasReservationsAsync(Guid roomId);
    }
}
