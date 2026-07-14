using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Models.Models
{
    public class Table
    {
        public Guid Id { get; set; }
        public int TableNumber { get; set; }
        public List<Reservation> Reservations { get; set; } = [];
        public int MinSeats { get; set; }
        public int MaxSeats { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public int Chairs { get; set; }
        public int Rotation { get; set; }
        public string Type { get; set; }
        public int Height { get; set; }
        public int Width { get; set; }
        public int Radius { get; set; }
        public Guid FloorPlanId { get; set; }
        [JsonIgnore]
        public FloorPlan? FloorPlan { get; set; }
        public List<int> ChairsLayout { get; set; } = new List<int>();

    }
}
