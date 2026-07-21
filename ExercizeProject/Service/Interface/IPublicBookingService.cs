using Models.DTOs.Public;

namespace Service.Interface
{
    public enum PublicBookingOutcome
    {
        Booked,
        RestaurantNotFound,
        OutsideServiceWindow,

        /// <summary>Covers cap reached or no table free at that time — the slot is gone.</summary>
        SlotUnavailable
    }

    public interface IPublicBookingService
    {
        // Null when the restaurant doesn't exist. Only services with configured hours
        // are listed — that's the owner's switch for enabling online booking.
        Task<PublicRestaurantDto?> GetRestaurantAsync(Guid restaurantId);

        // Bookable local start times per configured service for a date + party size.
        Task<IReadOnlyList<PublicAvailabilityDto>?> GetAvailabilityAsync(Guid restaurantId, DateOnly date, int partySize);

        Task<(PublicBookingOutcome Outcome, PublicBookingResultDto? Result)> BookAsync(
            Guid restaurantId, PublicBookingRequestDto request);
    }
}
