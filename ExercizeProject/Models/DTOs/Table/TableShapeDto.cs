using System;
using System.Collections.Generic;
using System.Text;

namespace Models.DTOs.Table
{
    public class TableShapeDto
    {
        public Guid Id { get; set; }
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
    }
}
