using Models.DTOs.Reservation;
using Models.Enums;
using Repository.Interfaces;
using Service.Interface;
using Entities = Models.Models;

namespace Service.Services
{
    public class ReservationService(IReservationRepository reservationRepository) : IReservationService
    {
        public async Task<IEnumerable<ReservationDto>> GetAllAsync(
            Guid organizationId,
            Guid? restaurantId = null,
            DateTime? from = null,
            DateTime? to = null,
            TimeFrame? timeFrame = null)
        {
            var reservations = await reservationRepository.GetAllAsync(
                organizationId, restaurantId, from, to, timeFrame);

            return reservations.Select(ToDto);
        }

        public async Task<ReservationDto?> GetByIdAsync(Guid id, Guid organizationId)
        {
            var reservation = await reservationRepository.GetByIdAsync(id, organizationId);
            return reservation is null ? null : ToDto(reservation);
        }

        public async Task<ReservationDto?> CreateAsync(CreateReservationDto reservationDto, Guid organizationId)
        {
            if (!await reservationRepository.RestaurantBelongsToOrganizationAsync(reservationDto.RestaurantId, organizationId))
                return null;

            if (reservationDto.TableId.HasValue &&
                !await reservationRepository.TableBelongsToOrganizationAsync(reservationDto.TableId.Value, organizationId))
                return null;

            Entities.Reservation reservation = new()
            {
                Name = reservationDto.Name,
                Email = reservationDto.Email,
                PhoneNumber = reservationDto.PhoneNumber,
                Description = reservationDto.Description,
                PartySize = reservationDto.PartySize,
                TimeFrame = reservationDto.TimeFrame,
                ReservationDateTime = reservationDto.ReservationDateTime,
                RestaurantId = reservationDto.RestaurantId,
                TableId = reservationDto.TableId,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            var created = await reservationRepository.CreateAsync(reservation);
            return ToDto(created);
        }

        public async Task<ReservationDto?> UpdateAsync(UpdateReservationDto reservationDto, Guid organizationId)
        {
            // Load the existing row rather than constructing a detached entity, so RestaurantId
            // and CreatedAt survive the update.
            var reservation = await reservationRepository.GetByIdAsync(reservationDto.Id, organizationId);
            if (reservation is null)
                return null;

            if (reservationDto.TableId.HasValue &&
                !await reservationRepository.TableBelongsToOrganizationAsync(reservationDto.TableId.Value, organizationId))
                return null;

            reservation.Name = reservationDto.Name;
            reservation.Email = reservationDto.Email;
            reservation.PhoneNumber = reservationDto.PhoneNumber;
            reservation.Description = reservationDto.Description;
            reservation.PartySize = reservationDto.PartySize;
            reservation.TimeFrame = reservationDto.TimeFrame;
            reservation.ReservationDateTime = reservationDto.ReservationDateTime;
            reservation.TableId = reservationDto.TableId;
            reservation.UpdatedAt = DateTime.UtcNow;

            await reservationRepository.UpdateAsync(reservation);

            // Re-read so a changed TableId reports the new table's number rather than the stale one.
            var updated = await reservationRepository.GetByIdAsync(reservationDto.Id, organizationId);
            return updated is null ? null : ToDto(updated);
        }

        public async Task<bool> DeleteAsync(Guid id, Guid organizationId)
        {
            return await reservationRepository.DeleteAsync(id, organizationId);
        }

        private static ReservationDto ToDto(Entities.Reservation r) => new()
        {
            Id = r.Id,
            Name = r.Name,
            Email = r.Email,
            PhoneNumber = r.PhoneNumber,
            Description = r.Description,
            PartySize = r.PartySize,
            TimeFrame = r.TimeFrame,
            ReservationDateTime = r.ReservationDateTime,
            RestaurantId = r.RestaurantId,
            RestaurantName = r.Restaurant?.Name,
            TableId = r.TableId,
            TableNumber = r.Table?.TableNumber,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        };
    }
}
