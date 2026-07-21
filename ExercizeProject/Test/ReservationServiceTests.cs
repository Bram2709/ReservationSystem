using Models.Enums;
using Models.Models;
using Xunit;

namespace Test
{
    public class ReservationServiceTests : IDisposable
    {
        private readonly TestApp _app = new();
        private static readonly DateTime Dinner19 = TestApp.LocalUtc(2030, 6, 10, 19);

        public void Dispose() => _app.Dispose();

        // --- Auto-assign / best fit ---

        [Fact]
        public async Task Create_AutoAssigns_SmallestFittingTable()
        {
            var s = _app.SeedRestaurant();

            var result = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19, partySize: 2), s.OrgId);

            Assert.Equal(CreateReservationOutcome.Created, result.Outcome);
            Assert.Equal(1, result.Reservation!.TableNumber); // the 2-seater, not the 4 or 6
            Assert.Equal(ReservationStatus.Confirmed, result.Reservation.Status);
        }

        [Fact]
        public async Task Create_PartyTooBigForSmallTables_GetsLargerTable()
        {
            var s = _app.SeedRestaurant();

            var result = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19, partySize: 5), s.OrgId);

            Assert.Equal(3, result.Reservation!.TableNumber); // only the 6-seater fits
        }

        [Fact]
        public async Task Create_PartyBiggerThanAnyTable_IsCreatedUnassigned()
        {
            var s = _app.SeedRestaurant();

            var result = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19, partySize: 9), s.OrgId);

            Assert.Equal(CreateReservationOutcome.Created, result.Outcome);
            Assert.Null(result.Reservation!.TableId);
        }

        // --- Time-overlap conflicts ---

        [Fact]
        public async Task Create_OverlappingReservation_TakesNextFreeTable()
        {
            var s = _app.SeedRestaurant();
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);

            var overlapping = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19.AddMinutes(30), 2), s.OrgId);

            Assert.Equal(2, overlapping.Reservation!.TableNumber); // #1 held 19:00–21:00
        }

        [Fact]
        public async Task Create_BackToBack_ReusesSameTable()
        {
            var s = _app.SeedRestaurant();
            var first = await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);

            // Default duration is 120: 19:00 ends exactly at 21:00, so 21:00 is free.
            var next = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19.AddMinutes(120), 2), s.OrgId);

            Assert.Equal(first.Reservation!.TableId, next.Reservation!.TableId);
        }

        [Fact]
        public async Task Create_WhenAllFittingTablesHeld_IsUnassigned()
        {
            var s = _app.SeedRestaurant();
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);

            var fourth = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);

            Assert.Null(fourth.Reservation!.TableId);
        }

        // --- Status lifecycle releases tables (second seating) ---

        [Theory]
        [InlineData(ReservationStatus.Finished)]
        [InlineData(ReservationStatus.NoShow)]
        [InlineData(ReservationStatus.Cancelled)]
        public async Task TerminalStatus_ReleasesTable_ForSecondSeating(ReservationStatus terminal)
        {
            var s = _app.SeedRestaurant();
            var first = await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);
            Assert.Equal(1, first.Reservation!.TableNumber);

            await _app.Reservations.UpdateStatusAsync(first.Reservation.Id, terminal, s.OrgId);

            var second = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19.AddMinutes(15), 2), s.OrgId);

            Assert.Equal(1, second.Reservation!.TableNumber); // the freed table is reused
        }

        [Fact]
        public async Task SeatedStatus_StillHoldsTable()
        {
            var s = _app.SeedRestaurant();
            var first = await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);

            await _app.Reservations.UpdateStatusAsync(first.Reservation!.Id, ReservationStatus.Seated, s.OrgId);

            var second = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19.AddMinutes(15), 2), s.OrgId);

            Assert.NotEqual(first.Reservation.TableId, second.Reservation!.TableId);
        }

        // --- Covers cap ---

        [Fact]
        public async Task Create_OverCoversCap_IsRejected()
        {
            var s = _app.SeedRestaurant(maxCovers: 5);
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 3), s.OrgId);
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);

            var over = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19, 1), s.OrgId);

            Assert.Equal(CreateReservationOutcome.OverCapacity, over.Outcome);
        }

        [Fact]
        public async Task CancelledReservations_DoNotCountTowardCovers()
        {
            var s = _app.SeedRestaurant(maxCovers: 5);
            var big = await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 5), s.OrgId);
            await _app.Reservations.UpdateStatusAsync(big.Reservation!.Id, ReservationStatus.Cancelled, s.OrgId);

            var after = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19, 5), s.OrgId);

            Assert.Equal(CreateReservationOutcome.Created, after.Outcome);
        }

        [Fact]
        public async Task Waitlisted_BypassesCap_AndGetsNoTable()
        {
            var s = _app.SeedRestaurant(maxCovers: 2);
            await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);

            var waitlisted = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19, 4, waitlisted: true), s.OrgId);

            Assert.Equal(CreateReservationOutcome.Created, waitlisted.Outcome);
            Assert.Equal(ReservationStatus.Waitlisted, waitlisted.Reservation!.Status);
            Assert.Null(waitlisted.Reservation.TableId);
        }

        // --- Service windows ---

        [Fact]
        public async Task Create_OutsideConfiguredWindow_IsRejected()
        {
            var s = _app.SeedRestaurant(dinnerWindow: (17 * 60, 22 * 60));

            var late = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, TestApp.LocalUtc(2030, 6, 10, 22, 30)), s.OrgId);

            Assert.Equal(CreateReservationOutcome.OutsideServiceWindow, late.Outcome);
        }

        [Fact]
        public async Task Create_InsideWindow_OrWithoutWindow_Succeeds()
        {
            var withWindow = _app.SeedRestaurant(dinnerWindow: (17 * 60, 22 * 60));
            var inside = await _app.Reservations.CreateAsync(
                TestApp.Booking(withWindow.RestaurantId, TestApp.LocalUtc(2030, 6, 10, 19)), withWindow.OrgId);
            Assert.Equal(CreateReservationOutcome.Created, inside.Outcome);

            var noWindow = _app.SeedRestaurant();
            var anyTime = await _app.Reservations.CreateAsync(
                TestApp.Booking(noWindow.RestaurantId, TestApp.LocalUtc(2030, 6, 10, 23, 45)), noWindow.OrgId);
            Assert.Equal(CreateReservationOutcome.Created, anyTime.Outcome);
        }

        // --- Manual assignment guards ---

        [Fact]
        public async Task AssignTable_Occupied_IsRefused_ThenAllowedAfterFinish()
        {
            var s = _app.SeedRestaurant();
            var holder = await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);
            var other = await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);
            Assert.Equal(s.Table2, holder.Reservation!.TableId);

            var refused = await _app.Reservations.AssignTableAsync(other.Reservation!.Id, s.Table2, s.OrgId);
            Assert.Equal(AssignTableOutcome.TableOccupied, refused.Outcome);

            await _app.Reservations.UpdateStatusAsync(holder.Reservation.Id, ReservationStatus.Finished, s.OrgId);

            var allowed = await _app.Reservations.AssignTableAsync(other.Reservation.Id, s.Table2, s.OrgId);
            Assert.Equal(AssignTableOutcome.Assigned, allowed.Outcome);
            Assert.Equal(1, allowed.Reservation!.TableNumber);
        }

        [Fact]
        public async Task AssignTable_FromAnotherRestaurant_IsRefused()
        {
            var s = _app.SeedRestaurant();
            var other = _app.SeedRestaurant(); // second restaurant (own org)
            var res = await _app.Reservations.CreateAsync(TestApp.Booking(s.RestaurantId, Dinner19, 2), s.OrgId);

            var result = await _app.Reservations.AssignTableAsync(res.Reservation!.Id, other.Table4, s.OrgId);

            Assert.Equal(AssignTableOutcome.TableNotInRestaurant, result.Outcome);
        }

        // --- Tenant isolation ---

        [Fact]
        public async Task CrossOrganization_AccessIsBlocked()
        {
            var mine = _app.SeedRestaurant();
            var theirs = _app.SeedRestaurant();
            var res = await _app.Reservations.CreateAsync(TestApp.Booking(mine.RestaurantId, Dinner19, 2), mine.OrgId);

            Assert.Null(await _app.Reservations.GetByIdAsync(res.Reservation!.Id, theirs.OrgId));

            var foreignCreate = await _app.Reservations.CreateAsync(
                TestApp.Booking(mine.RestaurantId, Dinner19, 2), theirs.OrgId);
            Assert.Equal(CreateReservationOutcome.NotOwned, foreignCreate.Outcome);
        }

        // --- Legacy data safety ---

        [Fact]
        public async Task ZeroDuration_LegacyRows_AreTreatedAs120Minutes()
        {
            var s = _app.SeedRestaurant();
            _app.Db.Add(new Reservation
            {
                Id = Guid.NewGuid(),
                Name = "Legacy",
                Email = "l@x.com",
                PhoneNumber = "1",
                PartySize = 2,
                TimeFrame = TimeFrame.Dinner,
                ReservationDateTime = Dinner19,
                RestaurantId = s.RestaurantId,
                TableId = s.Table2,
                DurationMinutes = 0, // pre-migration row
                Status = ReservationStatus.Confirmed,
            });
            _app.Db.SaveChanges();

            // Overlap math must treat the zero-duration hold as 2 hours: 20:00 conflicts.
            var overlapping = await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19.AddMinutes(60), 2), s.OrgId);

            Assert.NotEqual(s.Table2, overlapping.Reservation!.TableId);
        }

        // --- Emails ---

        [Fact]
        public async Task Create_SendsConfirmationEmail_ButNotForWaitlist()
        {
            var s = _app.SeedRestaurant();
            await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19, 2, email: "confirm@x.com"), s.OrgId);
            await _app.Reservations.CreateAsync(
                TestApp.Booking(s.RestaurantId, Dinner19, 2, waitlisted: true, email: "wait@x.com"), s.OrgId);

            Assert.Contains(_app.Emails.Sent, m => m.To == "confirm@x.com");
            Assert.DoesNotContain(_app.Emails.Sent, m => m.To == "wait@x.com");
        }
    }
}
