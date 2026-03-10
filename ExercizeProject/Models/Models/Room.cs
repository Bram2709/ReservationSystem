using System;
using System.Collections.Generic;
using System.Text;

namespace Models.Models
{
    public class Room
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public bool IsActive { get; set; }
        public List<Table> Tables { get; set; } = [];
        public int RestaurantId { get; set; }
        public Restaurant? Restaurant { get; set; }
    }
}
