using Microsoft.AspNetCore.Identity;
using NetTopologySuite.Geometries;

namespace PetApp.Api.Domain;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = "";
    public string? City { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
}

public class PetProfile
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = "";
    public PetType Type { get; set; }
    public string? Breed { get; set; }
    public DateOnly? BirthDate { get; set; }
    public string? PhotoUrl { get; set; }
}

public class Place
{
    public Guid Id { get; set; }
    public PlaceType Type { get; set; }
    public PlaceStatus Status { get; set; } = PlaceStatus.Approved;
    public Guid? OwnerId { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? Phone { get; set; }
    public Point Location { get; set; } = null!;
    public bool IsOpen24h { get; set; }
    public List<PetType> ServesPetTypes { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<WorkingHour> WorkingHours { get; set; } = new();
}

public class WorkingHour
{
    public Guid Id { get; set; }
    public Guid PlaceId { get; set; }
    public DayOfWeek Day { get; set; }
    public TimeOnly Opens { get; set; }
    public TimeOnly Closes { get; set; }
}

public class WalkerProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public string? Bio { get; set; }
    public decimal PricePerWalk { get; set; }
    public double ServiceRadiusKm { get; set; } = 5;
    public Point ApproxLocation { get; set; } = null!;   // rounded on purpose (privacy)
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class WalkRequest
{
    public Guid Id { get; set; }
    public Guid WalkerProfileId { get; set; }
    public WalkerProfile Walker { get; set; } = null!;
    public Guid OwnerId { get; set; }
    public ApplicationUser Owner { get; set; } = null!;
    public Guid? PetId { get; set; }
    public PetProfile? Pet { get; set; }
    public string? Message { get; set; }
    public DateTime? PreferredTime { get; set; }
    public RequestStatus Status { get; set; } = RequestStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Review
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public ReviewTargetType TargetType { get; set; }
    public Guid TargetId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class Favorite
{
    public Guid UserId { get; set; }
    public Guid PlaceId { get; set; }
    public Place Place { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Reminder
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? PetId { get; set; }
    public string Title { get; set; } = "";
    public string? Notes { get; set; }
    public DateTime DueAtUtc { get; set; }
    public RepeatInterval Repeat { get; set; }
    public string? TimeZoneId { get; set; }
    public bool IsDone { get; set; }
}

public class LostFoundPost
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public LostFoundType Type { get; set; }
    public PetType PetType { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? PhotoUrl { get; set; }
    public Point Location { get; set; } = null!;
    public string? ContactPhone { get; set; }
    public bool IsResolved { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class FoodItem
{
    public int Id { get; set; }
    public PetType PetType { get; set; }
    public string Key { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string NameMk { get; set; } = "";
    public Verdict Verdict { get; set; }
    public string ExplanationEn { get; set; } = "";
    public string ExplanationMk { get; set; } = "";
    public string Aliases { get; set; } = "";   
}

public class FoodCheckLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public PetType PetType { get; set; }
    public string Query { get; set; } = "";
    public Verdict Verdict { get; set; }
    public AnswerSource Source { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}