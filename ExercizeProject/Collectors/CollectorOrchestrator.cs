using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Collectors
{

    public class CollectorOrchestrator
    {
        private readonly IEnumerable<ISourceCollector> _collectors;
        private readonly CollectorsDbContext _db;
        private readonly ILogger<CollectorOrchestrator> _logger;

        public CollectorOrchestrator(IEnumerable<ISourceCollector> collectors, CollectorsDbContext db, ILogger<CollectorOrchestrator> logger)
            => (_collectors, _db, _logger) = (collectors, db, logger);

        public async Task RunAsync(CancellationToken ct = default)
        {
            foreach (var c in _collectors)
            {
                try
                {
                    var result = await c.CollectAsync();

                    if (result.RawArtifacts is { } raw) _db.RawPages.AddRange(raw);

                    foreach (var opp in result.Opportunities)
                    {
                        opp.Fingerprint = BuildFingerprint(opp);
                        var existing = await _db.Opportunities.FirstOrDefaultAsync(x => x.Fingerprint == opp.Fingerprint, ct);
                        if (existing is null)
                        {
                            opp.FirstSeenAt = opp.LastSeenAt = DateTimeOffset.UtcNow;
                            _db.Opportunities.Add(opp);
                        }
                        else
                        {
                            existing.LastSeenAt = DateTimeOffset.UtcNow;
                            existing.Description = opp.Description ?? existing.Description;
                            existing.Deadline = opp.Deadline ?? existing.Deadline;
                            existing.Budget = opp.Budget ?? existing.Budget;
                            existing.Skills = opp.Skills.Length > 0 ? opp.Skills : existing.Skills;
                            existing.IsActive = true;
                        }
                    }

                    await _db.SaveChangesAsync(ct);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Collector {Name} failed", "name");
                }
            }
        }

        private static string BuildFingerprint(Opportunity o)
        {
            var normalized = $"{o.Title.Trim().ToLowerInvariant()}|{o.Organization.Trim().ToLowerInvariant()}|{o.Deadline?.UtcDateTime:yyyy-MM-dd}|{new Uri(o.SourceUrl).Host}";
            using var sha = System.Security.Cryptography.SHA256.Create();
            var bytes = sha.ComputeHash(System.Text.Encoding.UTF8.GetBytes(normalized));
            return Convert.ToHexString(bytes);
        }
    }

}
