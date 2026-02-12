using System;
using System.Collections.Generic;
using System.Text;
using Models.DTOs.Reservation;
using Models.Models;
using Repository.Interfaces;
using Service.Interface;

namespace Service.Services
{
    public class ReservationService(IReservationRepository reservationRepository) : IReservationService
    {
        public async Task<IEnumerable<Reservation>> GetAllAsync()
        {
            return await reservationRepository.GetAllAsync();
        }

        public async Task<Reservation?> GetByIdAsync(int id)
        {
            return await reservationRepository.GetByIdAsync(id);
        }

        public async Task<Reservation> CreateAsync(CreateReservationDto reservationDto)
        {
            Reservation reservation = new()
            {
                Name = reservationDto.Name,
                Email = reservationDto.Email,
                PhoneNumber = reservationDto.PhoneNumber,
                Description = reservationDto.Description,
                PartySize = reservationDto.PartySize,
                TimeFrame = reservationDto.TimeFrame,
                ReservationDateTime = reservationDto.ReservationDateTime,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            return await reservationRepository.CreateAsync(reservation);
        }

        public async Task<Reservation> UpdateAsync(UpdateReservationDto reservationDto)
        {
            Reservation reservation = new()
            {
                Id = reservationDto.Id,
                Name = reservationDto.Name,
                Email = reservationDto.Email,
                PhoneNumber = reservationDto.PhoneNumber,
                Description = reservationDto.Description,
                PartySize = reservationDto.PartySize,
                TimeFrame = reservationDto.TimeFrame,
                ReservationDateTime = reservationDto.ReservationDateTime,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            return await reservationRepository.UpdateAsync(reservation);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await reservationRepository.DeleteAsync(id);
        }
    }
}
