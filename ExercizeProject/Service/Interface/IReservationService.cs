using System;
using System.Collections.Generic;
using System.Text;
using Models.DTOs.Reservation;
using Models.Models;

namespace Service.Interface
{
    public interface IReservationService
    {
        Task<IEnumerable<Reservation>> GetAllAsync();
        Task<Reservation?> GetByIdAsync(int id);
        Task<Reservation> CreateAsync(CreateReservationDto reservationDto);
        Task<Reservation> UpdateAsync(UpdateReservationDto reservationDto);
        Task<bool> DeleteAsync(int id);     
    }
}
