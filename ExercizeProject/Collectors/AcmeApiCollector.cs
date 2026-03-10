using System.Net.Http.Headers;
using System.Text.Json;
using System.Xml.Linq;
namespace Collectors
{
    public class AcmeApiCollector : ISourceCollector
    {
        private readonly HttpClient _http;
        public string Name => "AcmeApi";

        //private readonly ILogger<AcmeApiCollector> _logger;

        public AcmeApiCollector(IHttpClientFactory httpClientFactory)
        {
            _http = httpClientFactory.CreateClient("AcmeApi");
        }

        public async Task<CollectorResult> CollectAsync()
        {
            var list = new List<Opportunity>();
            var raw = new List<RawPage>();

            var page = 1;

            const int pageLimit = 100; // safety cutoff


            while (page <= pageLimit)
            {
                var url = $"opportunities?page={page}&pageSize=50";
                var res = await _http.GetAsync(url);
                var body = await res.Content.ReadAsStringAsync();

                raw.Add(new RawPage
                {
                    Source = Name,
                    Url = new Uri(_http.BaseAddress!, url).ToString(),
                    ContentType = res.Content.Headers.ContentType?.MediaType ?? "application/json",
                    Body = body,
                    StatusCode = (int)res.StatusCode,
                    FetchedAt = DateTimeOffset.UtcNow,
                    ETag = res.Headers.ETag?.Tag,
                    LastModified = res.Content.Headers.LastModified
                });

                if (!res.IsSuccessStatusCode)
                {
                    //_logger.LogWarning("Acme API returned {Status} for page {Page}", res.StatusCode, page);
                    if ((int)res.StatusCode >= 500) break; // server-side issue; bail
                    page++;
                    continue;
                }

                var data = JsonSerializer.Deserialize<List<ApiItem>>(body, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (data is null || data.Count == 0) break;

                list.AddRange(data.Select(MapToOpportunity));
                page++;
            }

            return new CollectorResult(Name, new Uri(_http.BaseAddress!, "opportunities").ToString(), list, raw);
        }


        private static DateTimeOffset? TryParseDate(string? s)
            => DateTimeOffset.TryParse(s, out var d) ? d : null;


        private Opportunity MapToOpportunity(ApiItem i) => new()
        {
            Title = i.title?.Trim() ?? "Untitled",
            Organization = string.IsNullOrWhiteSpace(i.organization) ? "Unknown" : i.organization!.Trim(),
            Description = i.description?.Trim(),
            Skills = (i.skills ?? new()).Select(s => s.Trim()).Where(s => s.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToArray(),
            Budget = i.budgetText,
            Deadline = TryParseDate(i.deadline),
            Category = i.category ?? "General",
            Source = Name,
            SourceUrl = i.url ?? ""
        };



        private sealed class ApiItem
        {
            public string? title { get; set; }
            public string? organization { get; set; }
            public string? description { get; set; }
            public List<string>? skills { get; set; }
            public string? budgetText { get; set; }
            public string? deadline { get; set; }
            public string? category { get; set; }
            public string? url { get; set; }
        }

    }


}
