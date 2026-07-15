using Models.DTOs.Reservation;
using Models.Enums;

namespace Service.Interface
{
    public interface IReservationService
    {
        Task<IEnumerable<ReservationDto>> GetAllAsync(
            Guid organizationId,
            Guid? restaurantId = null,
            DateTime? from = null,
            DateTime? to = null,
            TimeFrame? timeFrame = null);

        Task<ReservationDto?> GetByIdAsync(Guid id, Guid organizationId);

        // Null when the target restaurant or table is not owned by this organization.
        // When no table is supplied, tries to auto-assign an available one; the returned
        // reservation's TableId is null when nothing was free for the slot.
        Task<ReservationDto?> CreateAsync(CreateReservationDto reservationDto, Guid organizationId);

        // Null when the reservation does not exist for this organization, or the table is not owned by it.
        Task<ReservationDto?> UpdateAsync(UpdateReservationDto reservationDto, Guid organizationId);

        Task<bool> DeleteAsync(Guid id, Guid organizationId);

        // Every seatable table in the reservation's restaurant, flagged for fit and occupancy.
        // Null when the reservation does not exist for this organization.
        Task<IReadOnlyList<TableAvailabilityDto>?> GetAvailableTablesAsync(Guid reservationId, Guid organizationId);

        // Assigns (or clears, when tableId is null) the reservation's table.
        Task<(AssignTableOutcome Outcome, ReservationDto? Reservation)> AssignTableAsync(
            Guid reservationId, Guid? tableId, Guid organizationId);
    }
}
