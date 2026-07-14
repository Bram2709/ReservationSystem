using System;
using System.Collections.Generic;
using System.Text;

namespace Models.DTOs.Table
{
    public class UpdateTableDto
    {
        public Guid Id { get; set; }
        public int TableNumber { get; set; }
        public int MinSeats { get; set; } = 1;
        public int MaxSeats { get; set; }
        public Guid FloorPlanId { get; set; }
    }
}
