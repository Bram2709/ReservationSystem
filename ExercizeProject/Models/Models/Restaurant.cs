using System;
using System.Collections.Generic;
using System.Text;

namespace Models.Models
{
    public class Restaurant
    {

        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        public required string Name { get; set; }
        public string?Address { get; set; }

        // Service windows as minutes from midnight (e.g. 17:00 = 1020). Null = service closed.
        public int? BreakfastStart { get; set; }
        public int? BreakfastEnd { get; set; }
        public int? LunchStart { get; set; }
        public int? LunchEnd { get; set; }
        public int? DinnerStart { get; set; }
        public int? DinnerEnd { get; set; }

        // Default table-hold length for new reservations.
        public int DefaultDurationMinutes { get; set; } = 120;

        // Kitchen capacity guard: max total guests per service per day. Null = unlimited.
        public int? MaxCoversPerService { get; set; }

        public List<Room> Rooms { get; set; } = [];
    }
}
