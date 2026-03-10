using System;
using System.Collections.Generic;
using System.Text;

namespace Collectors
{
    public class Opportunity
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string Organization { get; set; } = null!;
        public string? Description { get; set; }
        public string[] Skills { get; set; } = Array.Empty<string>();
        public string? Budget { get; set; } // Keep string; structure varies widely
        public DateTimeOffset? Deadline { get; set; }
        public string Category { get; set; } = "General";
        public string Source { get; set; } = null!;
        public string SourceUrl { get; set; } = null!;
        public DateTimeOffset FirstSeenAt { get; set; }
        public DateTimeOffset LastSeenAt { get; set; }
        public string Fingerprint { get; set; } = null!; // dedup key
        public bool IsActive { get; set; } = true;

    }
}
