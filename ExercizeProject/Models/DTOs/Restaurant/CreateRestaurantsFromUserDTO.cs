using System;
using System.Collections.Generic;
using System.Text;

namespace Models.DTOs.Restaurant
{
    public class CreateRestaurantsFromUserDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        //public List<string> Rooms { get; set; } = new();

    }
}
