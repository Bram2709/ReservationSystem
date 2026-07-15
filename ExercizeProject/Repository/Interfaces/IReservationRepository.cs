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

        Task<bool> TableBelongsToRestaurantAsync(Guid tableId, Guid restaurantId);

        // Seatable tables (MaxSeats > 0) of a restaurant, with their room for display.
        Task<IReadOnlyList<Table>> GetSeatableTablesForRestaurantAsync(Guid restaurantId);

        // Reservations that hold a table in a given slot (same restaurant, day and service),
        // optionally excluding one reservation (itself, when reassigning).
        Task<IReadOnlyList<Reservation>> GetTableHoldersInSlotAsync(
            Guid restaurantId,
            DateTime dayStartUtc,
            DateTime dayEndUtc,
            TimeFrame timeFrame,
            Guid? excludeReservationId);
    }
}
