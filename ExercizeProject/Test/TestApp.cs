using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Models.DTOs.Reservation;
using Models.Enums;
using Models.Models;
using Repository;
using Repository.Extensions;
using Service.Interface;
using Service.Services;

namespace Test
{
    /// <summary>Records outgoing mail instead of sending it.</summary>
    public sealed class FakeEmailSender : IEmailSender
    {
        public List<(string To, string Subject)> Sent { get; } = [];

        public Task SendAsync(string to, string subject, string body)
        {
            Sent.Add((to, subject));
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// One isolated application per test: the real ApplicationDbContext, repositories and
    /// services (same DI wiring as production) on top of an in-memory SQLite database.
    /// </summary>
    public sealed class TestApp : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ServiceProvider _provider;
        private readonly IServiceScope _scope;

        public FakeEmailSender Emails { get; } = new();

        public ApplicationDbContext Db { get; }
        public IReservationService Reservations { get; }
        public IFloorplanInterface Floorplans { get; }
        public IPublicBookingService PublicBooking { get; }

        public TestApp()
        {
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            var services = new ServiceCollection();
            services.AddDbContext<ApplicationDbContext>(o => o.UseSqlite(_connection));
            services.AddRepositories();
            services.AddScoped<IReservationService, ReservationService>();
            services.AddScoped<IFloorplanInterface, FloorplanService>();
            services.AddScoped<IPublicBookingService, PublicBookingService>();
            services.AddSingleton<IEmailSender>(Emails);

            _provider = services.BuildServiceProvider();
            _scope = _provider.CreateScope();

            Db = _scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            Db.Database.EnsureCreated();

            Reservations = _scope.ServiceProvider.GetRequiredService<IReservationService>();
            Floorplans = _scope.ServiceProvider.GetRequiredService<IFloorplanInterface>();
            PublicBooking = _scope.ServiceProvider.GetRequiredService<IPublicBookingService>();
        }

        // --- Seeding ---

        public record Seeded(Guid OrgId, Guid RestaurantId, Guid RoomId, Guid Table2, Guid Table4, Guid Table6);

        /// <summary>
        /// An organization with one restaurant, one room, and three tables:
        /// #1 (2 seats), #2 (4 seats), #3 (6 seats).
        /// </summary>
        public Seeded SeedRestaurant(
            int? maxCovers = null,
            int defaultDuration = 120,
            (int start, int end)? dinnerWindow = null)
        {
            var org = new Organization { Id = Guid.NewGuid(), Name = "Test Org", CreatedAt = DateTime.UtcNow };
            var restaurant = new Restaurant
            {
                Id = Guid.NewGuid(),
                Name = "Test Bistro",
                OrganizationId = org.Id,
                DefaultDurationMinutes = defaultDuration,
                MaxCoversPerService = maxCovers,
                DinnerStart = dinnerWindow?.start,
                DinnerEnd = dinnerWindow?.end,
            };
            var room = new Room { Id = Guid.NewGuid(), Name = "Main", IsActive = true, RestaurantId = restaurant.Id };
            var plan = new FloorPlan { Id = Guid.NewGuid(), RoomId = room.Id };

            var t2 = MakeTable(plan.Id, 1, 2);
            var t4 = MakeTable(plan.Id, 2, 4);
            var t6 = MakeTable(plan.Id, 3, 6);

            Db.AddRange(org, restaurant, room, plan, t2, t4, t6);
            Db.SaveChanges();

            return new Seeded(org.Id, restaurant.Id, room.Id, t2.Id, t4.Id, t6.Id);
        }

        private static Table MakeTable(Guid planId, int number, int maxSeats) => new()
        {
            Id = Guid.NewGuid(),
            FloorPlanId = planId,
            TableNumber = number,
            MinSeats = 1,
            MaxSeats = maxSeats,
            Chairs = maxSeats,
            Type = "rect-table",
        };

        public static CreateReservationDto Booking(
            Guid restaurantId,
            DateTime whenUtc,
            int partySize = 2,
            TimeFrame timeFrame = TimeFrame.Dinner,
            bool waitlisted = false,
            Guid? tableId = null,
            int? durationMinutes = null,
            string email = "guest@example.com") => new()
            {
                Name = "Guest " + Guid.NewGuid().ToString()[..4],
                Email = email,
                PhoneNumber = "+31600000000",
                Description = "",
                PartySize = partySize,
                TimeFrame = timeFrame,
                ReservationDateTime = whenUtc,
                RestaurantId = restaurantId,
                Waitlisted = waitlisted,
                TableId = tableId,
                DurationMinutes = durationMinutes,
            };

        /// <summary>A UTC instant that is the given LOCAL wall-clock time (service windows compare locally).</summary>
        public static DateTime LocalUtc(int year, int month, int day, int hour, int minute = 0) =>
            new DateTime(year, month, day, hour, minute, 0, DateTimeKind.Local).ToUniversalTime();

        public void Dispose()
        {
            _scope.Dispose();
            _provider.Dispose();
            _connection.Dispose();
        }
    }
}
