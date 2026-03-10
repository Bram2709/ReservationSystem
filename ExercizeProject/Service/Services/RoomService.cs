using Service.Interface;
using Models.Models;
using Repository.Interfaces;
using Models.DTOs.Room;

namespace Service.Services
{
    public class RoomService(IRoomRepository roomRepository) : IRoomService
    {
        public async Task<IEnumerable<Room>> GetAllAsync()
        {
            return await roomRepository.GetAllAsync();
        }

        public async Task<Room?> GetByIdAsync(int id)
        {
            return await roomRepository.GetByIdAsync(id);
        }

        public async Task<Room> CreateAsync(CreateRoomDto roomDto)
        {
            Room room = new()
            {
                IsActive = roomDto.IsActive,
                Name = roomDto.Name,
                RestaurantId = roomDto.RestaurantId
            };

            return await roomRepository.CreateAsync(room);
        }

        public async Task<Room> UpdateAsync(UpdateRoomDto roomDto)
        {
            Room room = new()
            {
                Id = roomDto.Id,
                IsActive = roomDto.IsActive,
                Name = roomDto.Name,
                RestaurantId = roomDto.RestaurantId
            };

            return await roomRepository.UpdateAsync(room);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await roomRepository.DeleteAsync(id);
        }

        public Task OrganizeAsync(int roomId)
        {
            throw new NotImplementedException();
        }
    }
}
