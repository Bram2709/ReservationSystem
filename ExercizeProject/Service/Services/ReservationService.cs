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

            Guid? tableId = reservationDto.TableId;

            if (tableId.HasValue)
            {
                if (!await reservationRepository.TableBelongsToOrganizationAsync(tableId.Value, organizationId))
                    return null;
            }
            else
            {
                // No table chosen: try to seat the party automatically. Leaves TableId null when
                // nothing fits or everything is taken, so the caller can warn the user.
                tableId = await TryFindAvailableTableAsync(
                    reservationDto.RestaurantId,
                    reservationDto.PartySize,
                    reservationDto.ReservationDateTime,
                    reservationDto.TimeFrame,
                    excludeReservationId: null);
            }

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
                TableId = tableId,
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

        public async Task<IReadOnlyList<TableAvailabilityDto>?> GetAvailableTablesAsync(
            Guid reservationId, Guid organizationId)
        {
            var reservation = await reservationRepository.GetByIdAsync(reservationId, organizationId);
            if (reservation is null)
                return null;

            var tables = await reservationRepository.GetSeatableTablesForRestaurantAsync(reservation.RestaurantId);
            var occupants = await GetSlotOccupantsAsync(reservation, excludeReservationId: reservation.Id);

            return tables.Select(t =>
            {
                occupants.TryGetValue(t.Id, out var occupiedBy);
                return new TableAvailabilityDto
                {
                    Id = t.Id,
                    TableNumber = t.TableNumber,
                    MinSeats = t.MinSeats,
                    MaxSeats = t.MaxSeats,
                    RoomName = t.FloorPlan?.Room?.Name,
                    IsOccupied = occupiedBy is not null,
                    OccupiedByName = occupiedBy,
                    FitsParty = t.MaxSeats >= reservation.PartySize,
                    IsCurrent = reservation.TableId == t.Id
                };
            }).ToList();
        }

        public async Task<(AssignTableOutcome Outcome, ReservationDto? Reservation)> AssignTableAsync(
            Guid reservationId, Guid? tableId, Guid organizationId)
        {
            var reservation = await reservationRepository.GetByIdAsync(reservationId, organizationId);
            if (reservation is null)
                return (AssignTableOutcome.ReservationNotFound, null);

            if (tableId.HasValue)
            {
                if (!await reservationRepository.TableBelongsToRestaurantAsync(tableId.Value, reservation.RestaurantId))
                    return (AssignTableOutcome.TableNotInRestaurant, null);

                // Guard against double-booking, ignoring the reservation's own current hold.
                var occupants = await GetSlotOccupantsAsync(reservation, excludeReservationId: reservation.Id);
                if (occupants.ContainsKey(tableId.Value))
                    return (AssignTableOutcome.TableOccupied, null);
            }

            reservation.TableId = tableId;
            reservation.UpdatedAt = DateTime.UtcNow;
            await reservationRepository.UpdateAsync(reservation);

            // Re-read so TableNumber reflects the new table.
            var updated = await reservationRepository.GetByIdAsync(reservationId, organizationId);
            return (AssignTableOutcome.Assigned, updated is null ? null : ToDto(updated));
        }

        // Table id -> name of the reservation currently holding it in this reservation's slot.
        private async Task<Dictionary<Guid, string>> GetSlotOccupantsAsync(
            Entities.Reservation reservation, Guid? excludeReservationId)
        {
            var (dayStart, dayEnd) = DayBoundsUtc(reservation.ReservationDateTime);
            var holders = await reservationRepository.GetTableHoldersInSlotAsync(
                reservation.RestaurantId, dayStart, dayEnd, reservation.TimeFrame, excludeReservationId);

            return holders
                .Where(r => r.TableId.HasValue)
                .GroupBy(r => r.TableId!.Value)
                .ToDictionary(g => g.Key, g => g.First().Name);
        }

        private async Task<Guid?> TryFindAvailableTableAsync(
            Guid restaurantId, int partySize, DateTime dateTimeUtc, TimeFrame timeFrame, Guid? excludeReservationId)
        {
            var tables = await reservationRepository.GetSeatableTablesForRestaurantAsync(restaurantId);
            if (tables.Count == 0)
                return null;

            var (dayStart, dayEnd) = DayBoundsUtc(dateTimeUtc);
            var occupied = (await reservationRepository.GetTableHoldersInSlotAsync(
                    restaurantId, dayStart, dayEnd, timeFrame, excludeReservationId))
                .Where(r => r.TableId.HasValue)
                .Select(r => r.TableId!.Value)
                .ToHashSet();

            // Best fit: the smallest table that still seats the party, so larger tables stay
            // free for larger parties.
            return tables
                .Where(t => !occupied.Contains(t.Id) && t.MaxSeats >= partySize)
                .OrderBy(t => t.MaxSeats)
                .ThenBy(t => t.TableNumber)
                .Select(t => (Guid?)t.Id)
                .FirstOrDefault();
        }

        // UTC midnight boundaries of the reservation's calendar day.
        private static (DateTime Start, DateTime End) DayBoundsUtc(DateTime dateTime)
        {
            var utc = dateTime.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(dateTime, DateTimeKind.Utc)
                : dateTime.ToUniversalTime();
            var start = new DateTime(utc.Year, utc.Month, utc.Day, 0, 0, 0, DateTimeKind.Utc);
            return (start, start.AddDays(1));
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
