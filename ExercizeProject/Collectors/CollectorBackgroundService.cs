using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Text;

namespace Collectors
{
    public class CollectorBackgroundService
    {
        //private readonly CollectorOrchestrator _orchestrator;
        //private readonly ILogger<CollectorBackgroundService> _logger;
        //private readonly TimeSpan _interval = TimeSpan.FromHours(6);

        //public CollectorBackgroundService(CollectorOrchestrator orchestrator, ILogger<CollectorBackgroundService> logger)
        //    => (_orchestrator, _logger) = (orchestrator, logger);

        //protected async Task ExecuteAsync(CancellationToken stoppingToken)
        //{
        //    while (!stoppingToken.IsCancellationRequested)
        //    {
        //        _logger.LogInformation("Running collectors...");
        //        await _orchestrator.RunAsync(stoppingToken);
        //        _logger.LogInformation("Collectors finished. Sleeping {Hours}h", _interval.TotalHours);
        //        await Task.Delay(_interval, stoppingToken);
        //    }
        //}
    }

}
