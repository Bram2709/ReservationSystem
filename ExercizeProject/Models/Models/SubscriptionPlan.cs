using System;
using System.Collections.Generic;
using System.Text;

namespace Models.Models
{
    public class SubscriptionPlan
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public int MaxRestaurants { get; set; }
        public int MaxReservationsPerMonth { get; set; }
        public int MaxResourcesPerRestaurant { get; set; }
        public Guid StripePriceId { get; set; }
    }
}
