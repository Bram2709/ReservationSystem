
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Models.Models;
using System.Text.Json;

namespace Repository
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        public DbSet<Organization> Organizations { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
        public DbSet<Restaurant> Restaurants { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<Table> Tables { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<FloorPlan> FloorPlans { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Store ChairsLayout as JSON in a single text column. The value comparer makes EF
            // compare list contents (not references) so element-level edits are detected.
            modelBuilder.Entity<Table>()
                .Property(t => t.ChairsLayout)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new List<int>()
                        : JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions?)null) ?? new List<int>(),
                    new ValueComparer<List<int>>(
                        (a, b) => (a ?? new List<int>()).SequenceEqual(b ?? new List<int>()),
                        v => v.Aggregate(0, (hash, x) => HashCode.Combine(hash, x)),
                        v => v.ToList())
                );

            // Room-outline polygon vertices, same JSON-in-a-text-column pattern
            modelBuilder.Entity<Table>()
                .Property(t => t.Points)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => string.IsNullOrWhiteSpace(v)
                        ? new List<double>()
                        : JsonSerializer.Deserialize<List<double>>(v, (JsonSerializerOptions?)null) ?? new List<double>(),
                    new ValueComparer<List<double>>(
                        (a, b) => (a ?? new List<double>()).SequenceEqual(b ?? new List<double>()),
                        v => v.Aggregate(0, (hash, x) => HashCode.Combine(hash, x)),
                        v => v.ToList())
                );

            // SQL Server's datetime2 carries no timezone, so EF hands these back as
            // DateTimeKind.Unspecified and they serialize without a trailing 'Z'. The browser
            // then reads them as local time and every reservation is shown offset from the real
            // one. Reservation timestamps are always written as UTC, so tag them as UTC on read.
            var utc = new ValueConverter<DateTime, DateTime>(
                v => v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            var nullableUtc = new ValueConverter<DateTime?, DateTime?>(
                v => v.HasValue ? v.Value.ToUniversalTime() : v,
                v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

            modelBuilder.Entity<Reservation>(reservation =>
            {
                reservation.Property(r => r.ReservationDateTime).HasConversion(utc);
                reservation.Property(r => r.CreatedAt).HasConversion(utc);
                reservation.Property(r => r.UpdatedAt).HasConversion(nullableUtc);
                reservation.Property(r => r.DeletedAt).HasConversion(nullableUtc);
                reservation.Property(r => r.ReminderSentAt).HasConversion(nullableUtc);
            });
        }

        //protected override void OnModelCreating(ModelBuilder modelBuilder)
        //{
        //    base.OnModelCreating(modelBuilder);

        //    // Many users belong to one organization
        //    modelBuilder.Entity<User>()
        //        .HasOne(u => u.Organization)
        //        .WithMany(o => o.Users)
        //        .HasForeignKey(u => u.OrganizationId)
        //        .OnDelete(DeleteBehavior.Restrict);

        //    // Many restaurants belong to one organization
        //    modelBuilder.Entity<Restaurant>()
        //        .HasOne(r => r.Organization)
        //        .WithMany(o => o.Restaurants)
        //        .HasForeignKey(r => r.OrganizationId)
        //        .OnDelete(DeleteBehavior.Restrict);
        //}
    }
}
