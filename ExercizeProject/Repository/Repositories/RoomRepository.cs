using Microsoft.EntityFrameworkCore;
using Models.Models;
using Repository.Interfaces;

namespace Repository.Repositories
{
    public class RoomRepository(ApplicationDbContext context) : IRoomRepository
    {
        public async Task<Room?> GetByIdAsync(int id)
        {
            return await context.Rooms.FindAsync(id);
        }

        public async Task<IEnumerable<Room>> GetAllAsync()
        {
            return await context.Rooms.ToListAsync();
        }

        public async Task<Room> CreateAsync(Room room)
        {
            context.Rooms.Add(room);
            await context.SaveChangesAsync();
            return room;
        }

        public async Task<Room> UpdateAsync(Room room)
        {
            context.Rooms.Update(room);
            await context.SaveChangesAsync();
            return room;
        }
            
        public async Task<bool> DeleteAsync(int id)
        {
            var room = await context.Rooms.FindAsync(id);

            if (room == null)
            {
                return false;
            }

            context.Rooms.Remove(room);
            await context.SaveChangesAsync();
            return true;
        }
    }
}
