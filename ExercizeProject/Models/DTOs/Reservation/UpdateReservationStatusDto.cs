using Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Models.DTOs.Reservation
{
    public class UpdateReservationStatusDto
    {
        [EnumDataType(typeof(ReservationStatus))]
        public ReservationStatus Status { get; set; }
    }
}
