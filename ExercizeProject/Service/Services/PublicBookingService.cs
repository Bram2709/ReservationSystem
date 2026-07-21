using Models.DTOs.Public;
using Models.Enums;
using Repository.Interfaces;
using Service.Interface;
using Entities = Models.Models;

namespace Service.Services
{
    public class PublicBookingService(IReservationRepository reservationRepository, IEmailSender emailSender) : IPublicBookingService
    {
        private const int SlotStepMinutes = 30;
        /// <summary>Last online-bookable slot is this long before the service closes.</summary>
        private const int LastSeatingBufferMinutes = 60;
        /// <summary>Same-day slots must be at least this far in the future.</summary>
        private const int MinNoticeMinutes = 30;

        private static readonly TimeFrame[] AllServices =
            [TimeFrame.Breakfast, TimeFrame.Lunch, TimeFrame.Dinner];

        public async Task<PublicRestaurantDto?> GetRestaurantAsync(Guid restaurantId)
        {
            var restaurant = await reservationRepository.GetRestaurantPublicAsync(restaurantId);
            if (restaurant is null)
                return null;

            return new PublicRestaurantDto
            {
                Name = restaurant.Name,
                Address = restaurant.Address,
                Services = ConfiguredServices(restaurant)
                    .Select(s => new PublicServiceDto { TimeFrame = s.TimeFrame, Start = s.Start, End = s.End })
                    .ToList(),
            };
        }

        public async Task<IReadOnlyList<PublicAvailabilityDto>?> GetAvailabilityAsync(
            Guid restaurantId, DateOnly date, int partySize)
        {
            var restaurant = await reservationRepository.GetRestaurantPublicAsync(restaurantId);
            if (restaurant is null)
                return null;

            var tables = await reservationRepository.GetSeatableTablesForRestaurantAsync(restaurantId);
            var duration = ReservationRules.EffectiveDuration(restaurant.DefaultDurationMinutes);

            // One fetch covers the whole local day (holders window is ±12h around noon).
            var noonUtc = LocalDateTime(date, 12 * 60);
            var holders = await reservationRepository.GetActiveTableHoldersNearAsync(restaurantId, noonUtc, null);

            var earliest = DateTime.UtcNow.AddMinutes(MinNoticeMinutes);
            var result = new List<PublicAvailabilityDto>();

            foreach (var service in ConfiguredServices(restaurant))
            {
                var slots = new List<string>();

                var coversBooked = restaurant.MaxCoversPerService is null
                    ? 0
                    : await ActiveCoversAsync(restaurantId, date, service.TimeFrame);
                var coversOk = restaurant.MaxCoversPerService is not int cap || coversBooked + partySize <= cap;

                if (coversOk)
                {
                    for (var minute = service.Start; minute <= service.End - LastSeatingBufferMinutes; minute += SlotStepMinutes)
                    {
                        var startUtc = LocalDateTime(date, minute);
                        if (startUtc < earliest)
                            continue;

                        if (ReservationRules.BestFitTable(tables, holders, partySize, startUtc, duration) is not null)
                            slots.Add($"{minute / 60:D2}:{minute % 60:D2}");
                    }
                }

                result.Add(new PublicAvailabilityDto { TimeFrame = service.TimeFrame, Slots = slots });
            }

            return result;
        }

        public async Task<(PublicBookingOutcome Outcome, PublicBookingResultDto? Result)> BookAsync(
            Guid restaurantId, PublicBookingRequestDto request)
        {
            var restaurant = await reservationRepository.GetRestaurantPublicAsync(restaurantId);
            if (restaurant is null)
                return (PublicBookingOutcome.RestaurantNotFound, null);

            // Guests may only book services with configured hours, inside those hours.
            var (start, end) = ReservationRules.WindowFor(restaurant, request.TimeFrame);
            if (start is null || end is null ||
                !ReservationRules.WithinServiceWindow(restaurant, request.TimeFrame, request.ReservationDateTime))
                return (PublicBookingOutcome.OutsideServiceWindow, null);

            if (restaurant.MaxCoversPerService is int cap)
            {
                var (dayStart, dayEnd) = ReservationRules.DayBoundsUtc(request.ReservationDateTime);
                var booked = await reservationRepository.GetActiveCoversAsync(
                    restaurantId, dayStart, dayEnd, request.TimeFrame, null);
                if (booked + request.PartySize > cap)
                    return (PublicBookingOutcome.SlotUnavailable, null);
            }

            var duration = ReservationRules.EffectiveDuration(restaurant.DefaultDurationMinutes);
            var tables = await reservationRepository.GetSeatableTablesForRestaurantAsync(restaurantId);
            var holders = await reservationRepository.GetActiveTableHoldersNearAsync(
                restaurantId, request.ReservationDateTime, null);

            // Guests never book unassigned: no free table means the slot is gone.
            var tableId = ReservationRules.BestFitTable(
                tables, holders, request.PartySize, request.ReservationDateTime, duration);
            if (tableId is null)
                return (PublicBookingOutcome.SlotUnavailable, null);

            var reservation = new Entities.Reservation
            {
                Name = request.Name,
                Email = request.Email,
                PhoneNumber = request.PhoneNumber,
                Description = request.Description,
                PartySize = request.PartySize,
                TimeFrame = request.TimeFrame,
                ReservationDateTime = request.ReservationDateTime,
                RestaurantId = restaurantId,
                TableId = tableId,
                DurationMinutes = duration,
                Status = ReservationStatus.Confirmed,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false,
            };

            var created = await reservationRepository.CreateAsync(reservation);

            var whenLocal = created.ReservationDateTime.ToLocalTime();
            _ = emailSender.SendAsync(
                created.Email,
                $"Reservation confirmed at {restaurant.Name}",
                $"Hi {created.Name},\n\nYour reservation is confirmed:\n" +
                $"  Restaurant: {restaurant.Name}\n" +
                $"  When: {whenLocal:dddd d MMMM, HH:mm}\n" +
                $"  Party size: {created.PartySize}\n\nSee you then!");

            return (PublicBookingOutcome.Booked, new PublicBookingResultDto
            {
                ReservationId = created.Id,
                RestaurantName = restaurant.Name,
                ReservationDateTime = created.ReservationDateTime,
                PartySize = created.PartySize,
            });
        }

        // --- helpers ---

        private static List<(TimeFrame TimeFrame, int Start, int End)> ConfiguredServices(Entities.Restaurant restaurant) =>
            AllServices
                .Select(tf => (tf, Window: ReservationRules.WindowFor(restaurant, tf)))
                .Where(x => x.Window.Start is not null && x.Window.End is not null)
                .Select(x => (x.tf, x.Window.Start!.Value, x.Window.End!.Value))
                .ToList();

        /// <summary>Local wall-clock time on a date (minutes from midnight) as a UTC instant.</summary>
        private static DateTime LocalDateTime(DateOnly date, int minutesFromMidnight) =>
            new DateTime(date.Year, date.Month, date.Day,
                minutesFromMidnight / 60, minutesFromMidnight % 60, 0, DateTimeKind.Local).ToUniversalTime();

        private Task<int> ActiveCoversAsync(Guid restaurantId, DateOnly date, TimeFrame timeFrame)
        {
            var (dayStart, dayEnd) = ReservationRules.DayBoundsUtc(LocalDateTime(date, 12 * 60));
            return reservationRepository.GetActiveCoversAsync(restaurantId, dayStart, dayEnd, timeFrame, null);
        }
    }
}
