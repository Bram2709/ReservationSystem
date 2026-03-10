using System;
using System.Collections.Generic;
using System.Text;
using Models.Models;

namespace Models.DTOs.Table
{
    public class CreateTableDto
    {
        public int TableNumber { get; set; }
        public int MinSeats { get; set; } = 1;
        public int MaxSeats { get; set; }
        public int RoomId { get; set; }
    }
}
