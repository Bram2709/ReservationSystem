using Microsoft.EntityFrameworkCore;
using Models.DTOs.Customer;
using Models.Enums;
using Models.Models;
using Repository.Interfaces;

namespace Repository.Repositories
{
    internal class ReservationRepository(ApplicationDbContext context) : IReservationRepository
    {
        private static readonly ReservationStatus[] ActiveStatuses =
            [ReservationStatus.Confirmed, ReservationStatus.Seated];

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

        public async Task<bool> TableBelongsToRestaurantAsync(Guid tableId, Guid restaurantId)
        {
            return await context.Tables
                .AnyAsync(t => t.Id == tableId
                    && t.FloorPlan!.Room!.RestaurantId == restaurantId);
        }

        public async Task<Restaurant?> GetRestaurantForOrganizationAsync(Guid restaurantId, Guid organizationId)
        {
            return await context.Restaurants
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == restaurantId && r.OrganizationId == organizationId);
        }

        public async Task<IReadOnlyList<Table>> GetSeatableTablesForRestaurantAsync(Guid restaurantId)
        {
            // Walls and other decor have MaxSeats == 0 and are not seatable.
            return await context.Tables
                .Where(t => t.FloorPlan!.Room!.RestaurantId == restaurantId && t.MaxSeats > 0)
                .Include(t => t.FloorPlan!).ThenInclude(fp => fp.Room)
                .OrderBy(t => t.TableNumber)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Reservation>> GetActiveTableHoldersNearAsync(
            Guid restaurantId,
            DateTime aroundUtc,
            Guid? excludeReservationId)
        {
            // SQL narrows to a ±12h window (durations are capped well below that); the
            // service does the exact time-overlap math in memory.
            var from = aroundUtc.AddHours(-12);
            var to = aroundUtc.AddHours(12);

            var query = context.Reservations
                .Where(r => !r.IsDeleted
                    && r.RestaurantId == restaurantId
                    && r.TableId != null
                    && ActiveStatuses.Contains(r.Status)
                    && r.ReservationDateTime >= from
                    && r.ReservationDateTime < to);

            if (excludeReservationId.HasValue)
                query = query.Where(r => r.Id != excludeReservationId.Value);

            return await query.AsNoTracking().ToListAsync();
        }

        public async Task<int> GetActiveCoversAsync(
            Guid restaurantId,
            DateTime dayStartUtc,
            DateTime dayEndUtc,
            TimeFrame timeFrame,
            Guid? excludeReservationId)
        {
            var query = context.Reservations
                .Where(r => !r.IsDeleted
                    && r.RestaurantId == restaurantId
                    && r.TimeFrame == timeFrame
                    && ActiveStatuses.Contains(r.Status)
                    && r.ReservationDateTime >= dayStartUtc
                    && r.ReservationDateTime < dayEndUtc);

            if (excludeReservationId.HasValue)
                query = query.Where(r => r.Id != excludeReservationId.Value);

            return await query.SumAsync(r => (int?)r.PartySize) ?? 0;
        }

        public async Task<IReadOnlyList<CustomerDto>> GetCustomersAsync(Guid organizationId)
        {
            // Small projection to memory, grouped there — group-by-with-latest-name doesn't
            // translate cleanly to SQL and guest lists are organization-sized.
            var rows = await ScopedTo(organizationId)
                .Where(r => r.Email != "")
                .Select(r => new
                {
                    r.Name,
                    r.Email,
                    r.PhoneNumber,
                    r.PartySize,
                    r.Status,
                    r.ReservationDateTime,
                    r.CreatedAt
                })
                .AsNoTracking()
                .ToListAsync();

            return rows
                .GroupBy(r => r.Email.ToLowerInvariant())
                .Select(g =>
                {
                    var latest = g.OrderByDescending(r => r.CreatedAt).First();
                    return new CustomerDto
                    {
                        Name = latest.Name,
                        Email = latest.Email,
                        PhoneNumber = latest.PhoneNumber,
                        TotalReservations = g.Count(),
                        NoShows = g.Count(r => r.Status == ReservationStatus.NoShow),
                        TotalGuests = g.Sum(r => r.PartySize),
                        FirstVisit = g.Min(r => r.ReservationDateTime),
                        LastVisit = g.Max(r => r.ReservationDateTime)
                    };
                })
                .OrderByDescending(c => c.LastVisit)
                .ToList();
        }
    }
}
