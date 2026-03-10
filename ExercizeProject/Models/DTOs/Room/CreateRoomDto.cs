using Models.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Models.DTOs.Room
{
    public class CreateRoomDto
    {
        public required string Name { get; set; }
        public bool IsActive { get; set; }
        public int RestaurantId { get; set; }
    }
}
