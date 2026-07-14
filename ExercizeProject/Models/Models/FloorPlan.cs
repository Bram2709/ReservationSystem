using System;
using System.Collections.Generic;
using System.Text;

namespace Models.Models     
{
    public class FloorPlan
    {
        public Guid Id { get; set; }
        public Guid RoomId { get; set; }
        public Room? Room { get; set; }

        // renamed from `Tables` to `Shapes` to better reflect that these
        // can be different kinds of shapes (tables, circles, etc.)
        public List<Table> Shapes { get; set; } = new List<Table>();
    }
}
