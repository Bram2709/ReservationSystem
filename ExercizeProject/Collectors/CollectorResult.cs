using System;
using System.Collections.Generic;
using System.Text;


namespace Collectors
{
    public record CollectorResult(
        string Source,
        string SourceUrl,
        IEnumerable<Opportunity> Opportunities,
        IEnumerable<RawPage>? RawArtifacts = null);
}
