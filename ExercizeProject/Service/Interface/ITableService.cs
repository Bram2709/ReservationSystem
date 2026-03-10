using System;
using System.Collections.Generic;
using System.Text;
using Models.DTOs.Table;
using Models.Models;

namespace Service.Interface
{
    public interface ITableService
    {
        Task<IEnumerable<Table>> GetAllAsync();
        Task<Table?> GetByIdAsync(int id);
        Task<Table> CreateAsync(CreateTableDto tableDto);
        Task<Table> UpdateAsync(UpdateTableDto tableDto);
        Task<bool> DeleteAsync(int id);
        Task AssignReservationToTableAsync(int tableId, int reservationId);

    }
}
