using Models.DTOs.Customer;
using Models.DTOs.Reservation;
using Models.Enums;

namespace Service.Interface
{
    public record ReservationCreateResult(CreateReservationOutcome Outcome, ReservationDto? Reservation);

    public interface IReservationService
    {
        Task<IEnumerable<ReservationDto>> GetAllAsync(
            Guid organizationId,
            Guid? restaurantId = null,
            DateTime? from = null,
            DateTime? to = null,
            TimeFrame? timeFrame = null);

        Task<ReservationDto?> GetByIdAsync(Guid id, Guid organizationId);

        // Validates ownership, service window, and covers cap; auto-assigns a table when
        // none is supplied (unless waitlisted).
        Task<ReservationCreateResult> CreateAsync(CreateReservationDto reservationDto, Guid organizationId);

        // Null when the reservation does not exist for this organization, or the table is not owned by it.
        Task<ReservationDto?> UpdateAsync(UpdateReservationDto reservationDto, Guid organizationId);

        Task<bool> DeleteAsync(Guid id, Guid organizationId);

        // Null when the reservation does not exist for this organization.
        Task<ReservationDto?> UpdateStatusAsync(Guid id, ReservationStatus status, Guid organizationId);

        // Every seatable table in the reservation's restaurant, flagged for fit and occupancy.
        // Null when the reservation does not exist for this organization.
        Task<IReadOnlyList<TableAvailabilityDto>?> GetAvailableTablesAsync(Guid reservationId, Guid organizationId);

        // Assigns (or clears, when tableId is null) the reservation's table.
        Task<(AssignTableOutcome Outcome, ReservationDto? Reservation)> AssignTableAsync(
            Guid reservationId, Guid? tableId, Guid organizationId);

        Task<IReadOnlyList<CustomerDto>> GetCustomersAsync(Guid organizationId);
    }
}
