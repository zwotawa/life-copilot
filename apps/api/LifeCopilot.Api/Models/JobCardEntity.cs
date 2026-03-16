using System.ComponentModel.DataAnnotations;

namespace LifeCopilot.Api.Models;

public class JobCardEntity
{
    public Guid Id { get; set; }

    [Required] public string Company { get; set; } = "";
    [Required] public string Role { get; set; } = "";

    public string? Link { get; set; }

    [Required] public string Stage { get; set; } = "toApply";

    public long CreatedAt { get; set; }
    public long LastTouchedAt { get; set; }

    public string? NextAction { get; set; }

    public long? NextTouchedAt { get; set; }
}