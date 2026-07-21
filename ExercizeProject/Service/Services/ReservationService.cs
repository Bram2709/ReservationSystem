using Models.DTOs.Customer;
using Models.DTOs.Reservation;
using Models.Enums;
using Repository.Interfaces;
using Service.Interface;
using Entities = Models.Models;

namespace Service.Services
{
    public class ReservationService(IReservationRepository reservationRepository, IEmailSender emailSender) : IReservationService
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

        public async Task<ReservationCreateResult> CreateAsync(CreateReservationDto reservationDto, Guid organizationId)
        {
            var restaurant = await reservationRepository.GetRestaurantForOrganizationAsync(
                reservationDto.RestaurantId, organizationId);
            if (restaurant is null)
                return new(CreateReservationOutcome.NotOwned, null);

            if (reservationDto.TableId.HasValue &&
                !await reservationRepository.TableBelongsToOrganizationAsync(reservationDto.TableId.Value, organizationId))
                return new(CreateReservationOutcome.NotOwned, null);

            var duration = reservationDto.DurationMinutes
                ?? ReservationRules.EffectiveDuration(restaurant.DefaultDurationMinutes);

            Guid? tableId = reservationDto.TableId;

            // Waitlisted entries are queued only: no window/covers checks, no table.
            if (!reservationDto.Waitlisted)
            {
                if (!WithinServiceWindow(restaurant, reservationDto.TimeFrame, reservationDto.ReservationDateTime))
                    return new(CreateReservationOutcome.OutsideServiceWindow, null);

                if (restaurant.MaxCoversPerService is int cap)
                {
                    var (dayStart, dayEnd) = DayBoundsUtc(reservationDto.ReservationDateTime);
                    var booked = await reservationRepository.GetActiveCoversAsync(
                        restaurant.Id, dayStart, dayEnd, reservationDto.TimeFrame, null);
                    if (booked + reservationDto.PartySize > cap)
                        return new(CreateReservationOutcome.OverCapacity, null);
                }

                if (!tableId.HasValue)
                {
                    tableId = await TryFindAvailableTableAsync(
                        restaurant.Id, reservationDto.PartySize,
                        reservationDto.ReservationDateTime, duration, excludeReservationId: null);
                }
            }
            else
            {
                tableId = null;
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
                DurationMinutes = duration,
                Status = reservationDto.Waitlisted ? ReservationStatus.Waitlisted : ReservationStatus.Confirmed,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            var created = await reservationRepository.CreateAsync(reservation);

            if (!string.IsNullOrWhiteSpace(created.Email) && created.Status == ReservationStatus.Confirmed)
            {
                var when = created.ReservationDateTime.ToLocalTime();
                _ = emailSender.SendAsync(
                    created.Email,
                    $"Reservation confirmed at {created.Restaurant?.Name ?? "the restaurant"}",
                    $"Hi {created.Name},\n\nYour reservation is confirmed:\n" +
                    $"  Restaurant: {created.Restaurant?.Name}\n" +
                    $"  When: {when:dddd d MMMM, HH:mm}\n" +
                    $"  Party size: {created.PartySize}\n\nSee you then!");
            }

            return new(CreateReservationOutcome.Created, ToDto(created));
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
            if (reservationDto.DurationMinutes.HasValue)
                reservation.DurationMinutes = reservationDto.DurationMinutes.Value;
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

        public async Task<ReservationDto?> UpdateStatusAsync(Guid id, ReservationStatus status, Guid organizationId)
        {
            var reservation = await reservationRepository.GetByIdAsync(id, organizationId);
            if (reservation is null)
                return null;

            reservation.Status = status;
            reservation.UpdatedAt = DateTime.UtcNow;
            await reservationRepository.UpdateAsync(reservation);
            return ToDto(reservation);
        }

        public async Task<IReadOnlyList<TableAvailabilityDto>?> GetAvailableTablesAsync(
            Guid reservationId, Guid organizationId)
        {
            var reservation = await reservationRepository.GetByIdAsync(reservationId, organizationId);
            if (reservation is null)
                return null;

            var tables = await reservationRepository.GetSeatableTablesForRestaurantAsync(reservation.RestaurantId);
            var occupants = await GetOverlappingOccupantsAsync(reservation);

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
                var occupants = await GetOverlappingOccupantsAsync(reservation);
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

        public Task<IReadOnlyList<CustomerDto>> GetCustomersAsync(Guid organizationId) =>
            reservationRepository.GetCustomersAsync(organizationId);

        // --- Availability helpers (time-overlap model; math shared via ReservationRules) ---

        /// <summary>Table id -> holder name, for tables whose active reservations overlap this one in time.</summary>
        private async Task<Dictionary<Guid, string>> GetOverlappingOccupantsAsync(Entities.Reservation reservation)
        {
            var holders = await reservationRepository.GetActiveTableHoldersNearAsync(
                reservation.RestaurantId, reservation.ReservationDateTime, reservation.Id);

            return holders
                .Where(r => r.TableId.HasValue && ReservationRules.Overlaps(
                    reservation.ReservationDateTime, reservation.DurationMinutes,
                    r.ReservationDateTime, r.DurationMinutes))
                .GroupBy(r => r.TableId!.Value)
                .ToDictionary(g => g.Key, g => g.First().Name);
        }

        private async Task<Guid?> TryFindAvailableTableAsync(
            Guid restaurantId, int partySize, DateTime startUtc, int durationMinutes, Guid? excludeReservationId)
        {
            var tables = await reservationRepository.GetSeatableTablesForRestaurantAsync(restaurantId);
            if (tables.Count == 0)
                return null;

            var holders = await reservationRepository.GetActiveTableHoldersNearAsync(
                restaurantId, startUtc, excludeReservationId);

            return ReservationRules.BestFitTable(tables, holders, partySize, startUtc, durationMinutes);
        }

        private static bool WithinServiceWindow(Entities.Restaurant restaurant, TimeFrame timeFrame, DateTime whenUtc) =>
            ReservationRules.WithinServiceWindow(restaurant, timeFrame, whenUtc);

        private static (DateTime Start, DateTime End) DayBoundsUtc(DateTime dateTime) =>
            ReservationRules.DayBoundsUtc(dateTime);

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
            Status = r.Status,
            DurationMinutes = ReservationRules.EffectiveDuration(r.DurationMinutes),
            RestaurantId = r.RestaurantId,
            RestaurantName = r.Restaurant?.Name,
            TableId = r.TableId,
            TableNumber = r.Table?.TableNumber,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        };
    }
}
