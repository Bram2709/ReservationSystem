
using Microsoft.EntityFrameworkCore;
using Models.Models;

namespace Repository
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
    {
        public DbSet<Restaurant> Restaurants { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<Table> Tables { get; set; }
        public DbSet<Room> Rooms { get; set; }

    }
}
