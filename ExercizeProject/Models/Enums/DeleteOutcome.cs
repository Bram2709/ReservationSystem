namespace Models.Enums
{
    public enum DeleteOutcome
    {
        Deleted,

        /// <summary>No such record, or it belongs to another organization.</summary>
        NotFound,

        /// <summary>
        /// The record still has dependents (rooms, reservations) that would be silently
        /// cascade-deleted with it. Refused rather than destroying data.
        /// </summary>
        Blocked
    }
}
