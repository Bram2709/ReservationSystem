using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Models.Models;
using Repository.Interfaces;

namespace Repository.Repositories
{
    internal class ReservationRepository(ApplicationDbContext context) : IReservationRepository
    {
        public async Task<IEnumerable<Reservation>> GetAllAsync()
        {
            return await context.Reservations.ToListAsync();
        }

        public async Task<Reservation?> GetByIdAsync(int id)
        {
            return await context.Reservations.FindAsync(id);
        }

        public async Task<Reservation> CreateAsync(Reservation reservation)
        {
            context.Reservations.Add(reservation);
            await context.SaveChangesAsync();
            return reservation;
        }

        public async Task<Reservation> UpdateAsync(Reservation reservation)
        {
            context.Reservations.Update(reservation);
            await context.SaveChangesAsync();
            return reservation;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var reservation = await context.Reservations.FindAsync(id);
            if (reservation == null)
            {
                return false;
            }

            context.Reservations.Remove(reservation);
            await context.SaveChangesAsync();
            return true;
        }
    }
}
