using System;
using System.Collections.Generic;
using System.Text;

namespace Models.DTOs.Restaurant
{
    public class UpdateRestaurantDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
