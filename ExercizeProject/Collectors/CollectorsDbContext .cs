using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Collectors
{
    public class CollectorsDbContext(DbContextOptions<CollectorsDbContext> options) : DbContext(options)
    {
        public DbSet<RawPage> RawPages { get; set; }
        public DbSet<Opportunity> Opportunities { get; set; }

    }
}
