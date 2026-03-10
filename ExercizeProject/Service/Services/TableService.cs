using System;
using System.Collections.Generic;
using System.Text;
using Models.DTOs.Table;
using Models.Models;
using Repository.Interfaces;
using Service.Interface;

namespace Service.Services
{
    public class TableService(ITableRepository tableRepository) : ITableService
    {
        public async Task<IEnumerable<Table>> GetAllAsync()
        {
            return await tableRepository.GetAllAsync();
        }

        public async Task<Table?> GetByIdAsync(int id)
        {
            return await tableRepository.GetByIdAsync(id);
        }

        public async Task<Table> CreateAsync(CreateTableDto tableDto)
        {
            Table table = new()
            {
                TableNumber = tableDto.TableNumber,
                MaxSeats = tableDto.MaxSeats,
                MinSeats = tableDto.MinSeats,
                RoomId = tableDto.RoomId
            };

            return await tableRepository.CreateAsync(table);
        }

        public async Task<Table> UpdateAsync(UpdateTableDto tableDto)
        {
            Table table = new()
            {
                Id = tableDto.Id,
                TableNumber = tableDto.TableNumber,
                MaxSeats = tableDto.MaxSeats,
                MinSeats = tableDto.MinSeats,
                RoomId = tableDto.RoomId
            };

            return await tableRepository.UpdateAsync(table);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await tableRepository.DeleteAsync(id);
        }

        public Task AssignReservationToTableAsync(int tableId, int reservationId)
        {
            throw new NotImplementedException();
        }
    }
}
