namespace Models.Enums
{
    public enum CreateReservationOutcome
    {
        Created,

        /// <summary>Restaurant or table is not owned by the caller's organization.</summary>
        NotOwned,

        /// <summary>The requested time falls outside the restaurant's configured service window.</summary>
        OutsideServiceWindow,

        /// <summary>MaxCoversPerService would be exceeded for this day + service.</summary>
        OverCapacity
    }
}
