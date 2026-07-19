namespace Models.Enums
{
    public enum ReservationStatus
    {
        /// <summary>Booked and expected. Holds its table.</summary>
        Confirmed = 0,

        /// <summary>The party has arrived and is at the table. Holds its table.</summary>
        Seated = 1,

        /// <summary>The party left; the table is free again.</summary>
        Finished = 2,

        /// <summary>The party never arrived; the table is free again.</summary>
        NoShow = 3,

        /// <summary>Called off; the table is free again.</summary>
        Cancelled = 4,

        /// <summary>Waiting for capacity — no table held, not counted against covers.</summary>
        Waitlisted = 5
    }
}
