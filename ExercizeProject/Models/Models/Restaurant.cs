using System;
using System.Collections.Generic;
using System.Text;

namespace Models.Models
{
    public class Restaurant
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public List<Room> Rooms { get; set; } = [];
    }
}
