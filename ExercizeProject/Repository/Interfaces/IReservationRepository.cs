using Models.DTOs.Customer;
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

        // The restaurant with its settings, when owned by the organization.
        Task<Restaurant?> GetRestaurantForOrganizationAsync(Guid restaurantId, Guid organizationId);

        // Unscoped lookup for the public booking flow (guest pages have no organization).
        Task<Restaurant?> GetRestaurantPublicAsync(Guid restaurantId);

        // Seatable tables (MaxSeats > 0) of a restaurant, with their room for display.
        Task<IReadOnlyList<Table>> GetSeatableTablesForRestaurantAsync(Guid restaurantId);

        // Active (Confirmed/Seated) table-holding reservations near an instant, for
        // in-memory time-overlap checks. Window is wide enough for any duration.
        Task<IReadOnlyList<Reservation>> GetActiveTableHoldersNearAsync(
            Guid restaurantId,
            DateTime aroundUtc,
            Guid? excludeReservationId);

        // Total active guests booked for a day + service (waitlist excluded).
        Task<int> GetActiveCoversAsync(
            Guid restaurantId,
            DateTime dayStartUtc,
            DateTime dayEndUtc,
            TimeFrame timeFrame,
            Guid? excludeReservationId);

        // Guests aggregated by email across the organization's reservation history.
        Task<IReadOnlyList<CustomerDto>> GetCustomersAsync(Guid organizationId);
    }
}
