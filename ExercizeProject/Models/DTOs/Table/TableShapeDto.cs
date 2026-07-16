using System;
using System.Collections.Generic;
using System.Text;

namespace Models.DTOs.Table
{
    public class TableShapeDto
    {
        public Guid Id { get; set; }

        // Client-assigned table number; 0 when the shape is new and unnumbered.
        public int TableNumber { get; set; }

        public string? Type { get; set; }
        public int X { get; set; }
        public int Y { get; set; }

        // optional depending on shape
        public int? Width { get; set; }
        public int? Height { get; set; }
        public int? Radius { get; set; }

        public int Rotation { get; set; }

        public int Chairs { get; set; }

        // incoming chairs layout is an array in your JSON
        public List<int>? ChairsLayout { get; set; }

        // Explicit seat range. Nullable so older payloads without them still work — the
        // service falls back to deriving both from Chairs.
        public int? MinSeats { get; set; }
        public int? MaxSeats { get; set; }

        // Flattened [x1,y1,...] polygon for the "room-outline" shape; null/empty otherwise.
        public List<double>? Points { get; set; }
    }
}
