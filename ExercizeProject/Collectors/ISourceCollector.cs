using System;
using System.Collections.Generic;
using System.Text;

namespace Collectors
{
    public interface ISourceCollector
    {
        string Name { get; }
        Task<CollectorResult> CollectAsync();

    }
}
