using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Models.DTOs
{
    public class FloorplanDTO
    {
        public required Guid RoomId { get; set; }

        public required JsonElement Shapes { get; set; }
    }
}
