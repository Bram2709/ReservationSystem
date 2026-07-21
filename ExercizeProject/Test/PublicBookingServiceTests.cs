using Models.DTOs.Public;
using Models.Enums;
using Service.Interface;
using Xunit;

namespace Test
{
    public class PublicBookingServiceTests : IDisposable
    {
        private readonly TestApp _app = new();
        // A date far in the future so the min-notice filter never interferes.
        private static readonly DateOnly Date = new(2030, 6, 10);

        public void Dispose() => _app.Dispose();

        private static PublicBookingRequestDto Request(int party = 2, int localHour = 19, int localMinute = 0) => new()
        {
            Name = "Online Guest",
            Email = "online@example.com",
            PhoneNumber = "+31600000001",
            PartySize = party,
            TimeFrame = TimeFrame.Dinner,
            ReservationDateTime = TestApp.LocalUtc(Date.Year, Date.Month, Date.Day, localHour, localMinute),
        };

        [Fact]
        public async Task Restaurant_OnlyExposesServicesWithConfiguredHours()
        {
            var s = _app.SeedRestaurant(dinnerWindow: (17 * 60, 22 * 60));

            var dto = await _app.PublicBooking.GetRestaurantAsync(s.RestaurantId);

            Assert.NotNull(dto);
            var service = Assert.Single(dto!.Services); // breakfast/lunch unconfigured -> hidden
            Assert.Equal(TimeFrame.Dinner, service.TimeFrame);
        }

        [Fact]
        public async Task Availability_ListsSlots_InsideWindowWithLastSeatingBuffer()
        {
            var s = _app.SeedRestaurant(dinnerWindow: (18 * 60, 21 * 60)); // 18:00–21:00

            var availability = await _app.PublicBooking.GetAvailabilityAsync(s.RestaurantId, Date, 2);

            var dinner = Assert.Single(availability!);
            // Slots every 30 min from open to close − 60: 18:00 … 20:00.
            Assert.Equal(new[] { "18:00", "18:30", "19:00", "19:30", "20:00" }, dinner.Slots);
        }

        [Fact]
        public async Task Availability_HidesSlots_WhereNoTableFits()
        {
            var s = _app.SeedRestaurant(dinnerWindow: (18 * 60, 21 * 60));
            // Fill all three tables at 19:00 (default 120 min hold).
            var when = TestApp.LocalUtc(Date.Year, Date.Month, Date.Day, 19);
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, when, 2), s.OrgId);
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, when, 2), s.OrgId);
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, when, 2), s.OrgId);

            var availability = await _app.PublicBooking.GetAvailabilityAsync(s.RestaurantId, Date, 2);

            // Every slot overlapping 19:00–21:00 disappears; nothing before 18:00−? — 18:00+120 ends 20:00 > 19:00 → overlap too.
            Assert.Empty(Assert.Single(availability!).Slots);
        }

        [Fact]
        public async Task Book_CreatesConfirmedReservation_WithTable_AndEmail()
        {
            var s = _app.SeedRestaurant(dinnerWindow: (17 * 60, 22 * 60));

            var (outcome, result) = await _app.PublicBooking.BookAsync(s.RestaurantId, Request());

            Assert.Equal(PublicBookingOutcome.Booked, outcome);
            var stored = await _app.Reservations.GetByIdAsync(result!.ReservationId, s.OrgId);
            Assert.Equal(ReservationStatus.Confirmed, stored!.Status);
            Assert.NotNull(stored.TableId); // guests are always seated at a concrete table
            Assert.Contains(_app.Emails.Sent, m => m.To == "online@example.com");
        }

        [Fact]
        public async Task Book_WhenEverythingTaken_ReportsSlotUnavailable()
        {
            var s = _app.SeedRestaurant(dinnerWindow: (17 * 60, 22 * 60));
            var when = TestApp.LocalUtc(Date.Year, Date.Month, Date.Day, 19);
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, when, 2), s.OrgId);
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, when, 2), s.OrgId);
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, when, 2), s.OrgId);

            var (outcome, _) = await _app.PublicBooking.BookAsync(s.RestaurantId, Request());

            Assert.Equal(PublicBookingOutcome.SlotUnavailable, outcome);
        }

        [Fact]
        public async Task Book_OutsideHours_OrUnconfiguredService_IsRejected()
        {
            var s = _app.SeedRestaurant(dinnerWindow: (17 * 60, 22 * 60));

            var late = await _app.PublicBooking.BookAsync(s.RestaurantId, Request(localHour: 23));
            Assert.Equal(PublicBookingOutcome.OutsideServiceWindow, late.Outcome);

            var lunch = Request();
            lunch.TimeFrame = TimeFrame.Lunch; // no lunch hours configured -> not bookable online
            lunch.ReservationDateTime = TestApp.LocalUtc(Date.Year, Date.Month, Date.Day, 12);
            var lunchResult = await _app.PublicBooking.BookAsync(s.RestaurantId, lunch);
            Assert.Equal(PublicBookingOutcome.OutsideServiceWindow, lunchResult.Outcome);
        }

        [Fact]
        public async Task Book_RespectsCoversCap()
        {
            var s = _app.SeedRestaurant(maxCovers: 4, dinnerWindow: (17 * 60, 22 * 60));
            await _app.PublicBooking.BookAsync(s.RestaurantId, Request(party: 3));

            var (outcome, _) = await _app.PublicBooking.BookAsync(s.RestaurantId, Request(party: 2, localHour: 21));

            Assert.Equal(PublicBookingOutcome.SlotUnavailable, outcome);
        }
    }
}
