using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace Models.Models
{
    public class Room
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public bool IsActive { get; set; }
        public FloorPlan? FloorPlan { get; set; }
        public Guid RestaurantId { get; set; }
        //[JsonIgnore] DIT EN GEBRUIK DTOS ZODAT JE DEZE ERROR NIET MEER KRIJGT System.Text.Json.JsonException: A possible object cycle was detected. This can either be due to a cycle or if the object depth is larger than the maximum allowed depth of 32
        public Restaurant? Restaurant { get; set; }
    }
}
