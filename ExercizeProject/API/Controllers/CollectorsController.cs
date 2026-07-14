using Collectors;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/collectors")]
    public class CollectorsController : ControllerBase
    {
        private readonly CollectorOrchestrator _orchestrator;
        private readonly IEnumerable<ISourceCollector> _collectors;

        public CollectorsController(
            CollectorOrchestrator orchestrator,
            IEnumerable<ISourceCollector> collectors)
        {
            _orchestrator = orchestrator;
            _collectors = collectors;
        }

        // Run ALL collectors manually
        [HttpPost("run-all")]
        public async Task<IActionResult> RunAll(CancellationToken ct)
        {
            await _orchestrator.RunAsync(ct);
            return Ok(new { status = "ok", message = "All collectors executed." });
        }

        // Run a specific collector manually
        [HttpPost("run/{name}")]
        public async Task<IActionResult> RunByName(string name, CancellationToken ct)
        {
            var collector = _collectors.FirstOrDefault(c =>
                string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase));

            if (collector is null)
                return NotFound(new { status = "error", message = $"Collector '{name}' not found." });

            var result = await collector.CollectAsync();
            return Ok(new
            {
                status = "ok",
                collector = collector.Name,
                opportunities = result.Opportunities.Count(),
                rawArtifacts = result.RawArtifacts?.Count() ?? 0
            });
        }

        // Optional: Get list of available collectors
        [HttpGet]
        public IActionResult ListCollectors()
        {
            return Ok(_collectors.Select(c => c.Name));
        }
    }

}
