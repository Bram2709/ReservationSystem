using Microsoft.EntityFrameworkCore;
using Models.Enums;
using Models.Models;
using Repository.Interfaces;

namespace Repository.Repositories
{
    internal class ReservationRepository(ApplicationDbContext context) : IReservationRepository
    {
        private IQueryable<Reservation> ScopedTo(Guid organizationId) =>
            context.Reservations
                .Where(r => !r.IsDeleted && r.Restaurant!.OrganizationId == organizationId);

        public async Task<IEnumerable<Reservation>> GetAllAsync(
            Guid organizationId,
            Guid? restaurantId = null,
            DateTime? from = null,
            DateTime? to = null,
            TimeFrame? timeFrame = null)
        {
            var query = ScopedTo(organizationId);

            if (restaurantId.HasValue)
                query = query.Where(r => r.RestaurantId == restaurantId.Value);

            if (from.HasValue)
                query = query.Where(r => r.ReservationDateTime >= from.Value);

            if (to.HasValue)
                query = query.Where(r => r.ReservationDateTime < to.Value);

            if (timeFrame.HasValue)
                query = query.Where(r => r.TimeFrame == timeFrame.Value);

            return await query
                .Include(r => r.Restaurant)
                .Include(r => r.Table)
                .OrderBy(r => r.ReservationDateTime)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Reservation?> GetByIdAsync(Guid id, Guid organizationId)
        {
            // Tracked on purpose: the service mutates the returned entity and calls UpdateAsync.
            return await ScopedTo(organizationId)
                .Include(r => r.Restaurant)
                .Include(r => r.Table)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<Reservation> CreateAsync(Reservation reservation)
        {
            context.Reservations.Add(reservation);
            await context.SaveChangesAsync();

            // Reload so the caller gets Restaurant/Table populated for the response DTO.
            await context.Entry(reservation).Reference(r => r.Restaurant).LoadAsync();
            if (reservation.TableId.HasValue)
                await context.Entry(reservation).Reference(r => r.Table).LoadAsync();

            return reservation;
        }

        public async Task<Reservation> UpdateAsync(Reservation reservation)
        {
            await context.SaveChangesAsync();
            return reservation;
        }

        public async Task<bool> DeleteAsync(Guid id, Guid organizationId)
        {
            var reservation = await ScopedTo(organizationId).FirstOrDefaultAsync(r => r.Id == id);
            if (reservation is null)
                return false;

            reservation.IsDeleted = true;
            reservation.DeletedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RestaurantBelongsToOrganizationAsync(Guid restaurantId, Guid organizationId)
        {
            return await context.Restaurants
                .AnyAsync(r => r.Id == restaurantId && r.OrganizationId == organizationId);
        }

        public async Task<bool> TableBelongsToOrganizationAsync(Guid tableId, Guid organizationId)
        {
            // Table -> FloorPlan -> Room -> Restaurant -> Organization
            return await context.Tables
                .AnyAsync(t => t.Id == tableId
                    && t.FloorPlan!.Room!.Restaurant!.OrganizationId == organizationId);
        }
    }
}
