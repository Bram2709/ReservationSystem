using Models.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Models.DTOs.Reservation
{
    public class UpdateReservationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int PartySize { get; set; }
        public TimeFrame TimeFrame { get; set; }
        public DateTime ReservationDateTime { get; set; }
        public int? TableId { get; set; }
    }
}
