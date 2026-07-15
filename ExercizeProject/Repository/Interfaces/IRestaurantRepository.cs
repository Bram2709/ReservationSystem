using Models.Models;

namespace Repository.Interfaces
{
    public interface IRestaurantRepository
    {
        Task<IEnumerable<Restaurant>> GetAllRestaurantsFromUserAsync(Guid organizationId);

        Task<Restaurant?> GetByIdAsync(Guid id, Guid organizationId);

        Task<Restaurant> CreateAsync(Restaurant restaurant);

        // Persists an entity already tracked by the current context.
        Task<Restaurant> UpdateAsync(Restaurant restaurant);

        Task<bool> DeleteAsync(Restaurant restaurant);

        // Guards a delete that would otherwise cascade rooms/reservations away with the restaurant.
        Task<bool> HasRoomsAsync(Guid restaurantId);

        Task<bool> HasReservationsAsync(Guid restaurantId);
    }
}
