using System;
using System.Collections.Generic;
using Models.Enums;

namespace Models.Models
{
    public class Organization
    {
        public Guid Id { get; set; }
        public string Name { get; set; }

        public string? StripeCustomerId { get; set; }
        public string? StripeCustomerName { get; set; }
        public SubscriptionStatus SubscriptionStatus { get; set; }

        public Guid? SubscriptionPlanId { get; set; }
        public SubscriptionPlan? SubscriptionPlan { get; set; }


        public DateTime CreatedAt { get; set; }

        public ICollection<User>? Users { get; set; }
        public ICollection<Restaurant>? Restaurants { get; set; }

    }
}
