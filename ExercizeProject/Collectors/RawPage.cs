using System;
using System.Collections.Generic;
using System.Text;

namespace Collectors
{
    public class RawPage
    {
        public Guid Id { get; set; }
        public string Source { get; set; } = null!;
        public string Url { get; set; } = null!;
        public string ContentType { get; set; } = "text/html";
        public string Body { get; set; } = null!;
        public int StatusCode { get; set; }
        public DateTimeOffset FetchedAt { get; set; }
        public string? ETag { get; set; }
        public DateTimeOffset? LastModified { get; set; }
        

    }
}
