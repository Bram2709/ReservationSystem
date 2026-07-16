using Models.DTOs;

namespace Service.Interface
{
    public interface IFloorplanInterface
    {
        // Null when the room is not owned by the caller's organization.
        Task<FloorplanSaveResultDto?> SaveFloorPlanAsync(FloorplanDTO floorplanDto, Guid organizationId);
    }
}
