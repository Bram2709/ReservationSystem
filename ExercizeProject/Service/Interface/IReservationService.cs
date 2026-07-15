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
        Task<ReservationDto?> CreateAsync(CreateReservationDto reservationDto, Guid organizationId);

        // Null when the reservation does not exist for this organization, or the table is not owned by it.
        Task<ReservationDto?> UpdateAsync(UpdateReservationDto reservationDto, Guid organizationId);

        Task<bool> DeleteAsync(Guid id, Guid organizationId);
    }
}
