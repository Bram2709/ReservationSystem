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

        public List<Room> Rooms { get; set; } = [];
    }
}
