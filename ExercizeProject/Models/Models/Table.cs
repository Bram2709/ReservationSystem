using System;
using System.Collections.Generic;
using System.Text;

namespace Models.Models
{
    public class Table
    {
        public int Id { get; set; }
        public int TableNumber { get; set; }
        public List<Reservation> Reservations { get; set; } = [];
        public int MinSeats { get; set; } = 1;
        public int MaxSeats { get; set; }
        public int RoomId { get; set; }
        public Room? Room { get; set; }
    }
}
