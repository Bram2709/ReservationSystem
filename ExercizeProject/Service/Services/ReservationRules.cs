using Models.Enums;
using Entities = Models.Models;

namespace Service.Services
{
    /// <summary>
    /// Availability math shared by the staff reservation service and the public booking
    /// service, so the two paths can never disagree about what "free" means.
    /// </summary>
    internal static class ReservationRules
    {
        public const int FallbackDurationMinutes = 120;

        public static int EffectiveDuration(int minutes) =>
            minutes > 0 ? minutes : FallbackDurationMinutes;

        public static bool Overlaps(DateTime aStart, int aMinutes, DateTime bStart, int bMinutes) =>
            aStart < bStart.AddMinutes(EffectiveDuration(bMinutes)) &&
            bStart < aStart.AddMinutes(EffectiveDuration(aMinutes));

        public static (int? Start, int? End) WindowFor(Entities.Restaurant restaurant, TimeFrame timeFrame) =>
            timeFrame switch
            {
                TimeFrame.Breakfast => (restaurant.BreakfastStart, restaurant.BreakfastEnd),
                TimeFrame.Lunch => (restaurant.LunchStart, restaurant.LunchEnd),
                TimeFrame.Dinner => (restaurant.DinnerStart, restaurant.DinnerEnd),
                _ => (null, null)
            };

        /// <summary>
        /// True when the reservation's local time falls inside the restaurant's configured
        /// window for that service; unconfigured windows don't restrict. Times are compared
        /// in server-local time, assuming the restaurant runs in the server's timezone.
        /// </summary>
        public static bool WithinServiceWindow(Entities.Restaurant restaurant, TimeFrame timeFrame, DateTime whenUtc)
        {
            var (start, end) = WindowFor(restaurant, timeFrame);
            if (start is null || end is null)
                return true;

            var local = whenUtc.Kind == DateTimeKind.Unspecified ? whenUtc : whenUtc.ToLocalTime();
            var minutes = local.Hour * 60 + local.Minute;

            return minutes >= start.Value && minutes < end.Value;
        }

        /// <summary>UTC midnight boundaries of the reservation's calendar day.</summary>
        public static (DateTime Start, DateTime End) DayBoundsUtc(DateTime dateTime)
        {
            var utc = dateTime.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(dateTime, DateTimeKind.Utc)
                : dateTime.ToUniversalTime();
            var start = new DateTime(utc.Year, utc.Month, utc.Day, 0, 0, 0, DateTimeKind.Utc);
            return (start, start.AddDays(1));
        }

        /// <summary>
        /// Smallest free table that seats the party at [startUtc, startUtc + duration),
        /// given the slot's already-fetched active holders. Null when nothing fits.
        /// </summary>
        public static Guid? BestFitTable(
            IReadOnlyList<Entities.Table> tables,
            IReadOnlyList<Entities.Reservation> activeHolders,
            int partySize,
            DateTime startUtc,
            int durationMinutes)
        {
            var occupied = activeHolders
                .Where(r => r.TableId.HasValue &&
                    Overlaps(startUtc, durationMinutes, r.ReservationDateTime, r.DurationMinutes))
                .Select(r => r.TableId!.Value)
                .ToHashSet();

            return tables
                .Where(t => !occupied.Contains(t.Id) && t.MaxSeats >= partySize)
                .OrderBy(t => t.MaxSeats)
                .ThenBy(t => t.TableNumber)
                .Select(t => (Guid?)t.Id)
                .FirstOrDefault();
        }
    }
}
