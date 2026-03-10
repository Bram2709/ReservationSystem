using Models.Enums;
using Models.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Models.DTOs.Reservation
{
    public class CreateReservationDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int PartySize { get; set; }
        public TimeFrame TimeFrame { get; set; }
        public DateTime ReservationDateTime { get; set; }
        
    }
}
