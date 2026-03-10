using HtmlAgilityPack;
using Microsoft.Extensions.Logging;
using Microsoft.Playwright;

namespace Collectors.Scrapers
{
    public class DevpostScraperCollector : ISourceCollector
    {
        private readonly ILogger<DevpostScraperCollector> _logger;

        public string Name => "DevpostScraper";

        private const string ListingUrl = "https://devpost.com/hackathons";

        public DevpostScraperCollector(ILogger<DevpostScraperCollector> logger)
        {
            _logger = logger;
        }

        public async Task<CollectorResult> CollectAsync()
        {
            using var playwright = await Playwright.CreateAsync();
            await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions { Headless = true });
            var browserPage = await browser.NewPageAsync();

            await browserPage.GotoAsync(ListingUrl, new PageGotoOptions { WaitUntil = WaitUntilState.NetworkIdle });

            // Wait until at least one card is in the DOM
            await browserPage.WaitForSelectorAsync("div[class*='hackathon-tile']");

            var html = await browserPage.ContentAsync();

            var raws = new List<RawPage>
            {
                new RawPage
                {
                    Source = Name,
                    Url = ListingUrl,
                    Body = html,
                    ContentType = "text/html",
                    StatusCode = 200,
                    FetchedAt = DateTimeOffset.UtcNow
                }
            };

            var doc = new HtmlDocument();
            doc.LoadHtml(html);
            //https://www.it-contracts.nl/nieuwste-freelance-ict-opdrachten?search=.Net+Applicatieontwikkeling+Applicatiebeheer+Architectuur+.Net&search_vakgebied=&search_min=&search_provincie=
            //https://striive.com/en/blog/best-freelance-platforms-netherlands



            var cards = doc.DocumentNode.SelectNodes("//div[contains(@class,'hackathon-tile')]")
                        ?? new HtmlNodeCollection(null);

            var opportunities = new List<Opportunity>();

            foreach (var card in cards)
            {
                try
                {
                    var titleNode = card.SelectSingleNode(".//h3/a");
                    var title = titleNode?.InnerText?.Trim() ?? "Untitled";

                    var href = titleNode?.GetAttributeValue("href", null);
                    var detailUrl = href ?? ListingUrl;

                    var orgNode = card.SelectSingleNode(".//span[contains(@class,'hackathon-organization')]");
                    var organization = orgNode?.InnerText?.Trim() ?? "Unknown";

                    var prizeNode = card.SelectSingleNode(".//span[contains(@class,'prize-amount')]");
                    var budget = prizeNode?.InnerText?.Trim();

                    var deadlineNode = card.SelectSingleNode(".//span[contains(@class,'submission-deadline') or contains(@class,'dates')]");
                    var deadlineText = deadlineNode?.InnerText?.Trim();
                    DateTimeOffset? deadline = DateTimeOffset.TryParse(deadlineText, out var parsed) ? parsed : null;

                    opportunities.Add(new Opportunity
                    {
                        Title = HtmlEntity.DeEntitize(title),
                        Organization = HtmlEntity.DeEntitize(organization),
                        Description = "Imported from Devpost. Visit page for full details.",
                        Budget = budget,
                        Deadline = deadline,
                        Category = "Hackathon",
                        Source = Name,
                        SourceUrl = detailUrl
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error parsing a Devpost hackathon card");
                }
            }

            return new CollectorResult(Name, SourceUrl: ListingUrl, opportunities, raws);
        }
    }
}
