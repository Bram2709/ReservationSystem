using System;
using System.Collections.Generic;
using System.Text;
using Models.Models;

namespace Repository.Interfaces
{
    public interface IRoomRepository
    {
        Task<Room?> GetByIdAsync(int id);
        Task<IEnumerable<Room>> GetAllAsync();
        Task<Room> CreateAsync(Room room);
        Task<Room> UpdateAsync(Room room);
        Task<bool> DeleteAsync(int id);
    }
}
