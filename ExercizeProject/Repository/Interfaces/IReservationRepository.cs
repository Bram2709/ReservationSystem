using Models.Enums;
using Models.Models;

namespace Repository.Interfaces
{
    public interface IReservationRepository
    {
        // Reads are scoped to an organization: a reservation belongs to one through its Restaurant.
        Task<IEnumerable<Reservation>> GetAllAsync(
            Guid organizationId,
            Guid? restaurantId = null,
            DateTime? from = null,
            DateTime? to = null,
            TimeFrame? timeFrame = null);

        Task<Reservation?> GetByIdAsync(Guid id, Guid organizationId);

        Task<Reservation> CreateAsync(Reservation reservation);

        // Persists an entity already tracked by the current context.
        Task<Reservation> UpdateAsync(Reservation reservation);

        // Soft-deletes. False when the reservation does not exist for this organization.
        Task<bool> DeleteAsync(Guid id, Guid organizationId);

        Task<bool> RestaurantBelongsToOrganizationAsync(Guid restaurantId, Guid organizationId);

        Task<bool> TableBelongsToOrganizationAsync(Guid tableId, Guid organizationId);
    }
}
