using System;
using System.Collections.Generic;
using System.Text;
using Models.DTOs.Room;
using Models.Models;

namespace Service.Interface
{
    public interface IRoomService
    {
        Task<IEnumerable<Room>> GetAllAsync();
        Task<Room?> GetByIdAsync(int id);
        Task<Room> CreateAsync(CreateRoomDto roomDto);
        Task<Room> UpdateAsync(UpdateRoomDto roomDto);
        Task<bool> DeleteAsync(int id);

        Task OrganizeAsync(int roomId);
    }
}
