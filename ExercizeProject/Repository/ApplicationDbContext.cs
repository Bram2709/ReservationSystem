
using Microsoft.EntityFrameworkCore;
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

            // Store ChairsLayout as JSON in a single text column
            modelBuilder.Entity<Table>()
                .Property(t => t.ChairsLayout)
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<int>>(v) ?? new List<int>()
                );
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
