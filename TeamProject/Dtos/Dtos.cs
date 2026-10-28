using PetApp.Api.Domain;

namespace PetApp.Api.Dtos;

public record ApiError(string Code, string? Detail = null);
public record PagedResult<T>(List<T> Items, int Page, int PageSize, int Total);

// ---------- Auth / profile ----------
public record PetInput(PetType Type, string? Name, string? Breed, DateOnly? BirthDate, string? PhotoUrl);
public record RegisterOwnerRequest(string Email, string Password, string FullName, string? Phone, string? City, List<PetInput>? Pets);
public record RegisterShopRequest(string Email, string Password, string FullName, string? Phone, string? City, PlaceInput? Shop);
public record LoginRequest(string Email, string Password);
public record RefreshRequest(string RefreshToken);
public record UpdateProfileRequest(string FullName, string? Phone, string? City);
public record UserDto(Guid Id, string Email, string FullName, string? Phone, string? City, List<string> Roles);
public record AuthResponse(string AccessToken, string RefreshToken, DateTime AccessTokenExpiresAt, UserDto User);

// ---------- Pets ----------
public record PetDto(Guid Id, string Name, PetType Type, string? Breed, DateOnly? BirthDate, string? PhotoUrl);

// ---------- Places ----------
public record WorkingHourDto(DayOfWeek Day, TimeOnly Opens, TimeOnly Closes);

public record PlaceInput(PlaceType Type, string Name, string? Description, string? Address, string? City,
    string? WebsiteUrl, string? Phone, double Latitude, double Longitude, bool IsOpen24h,
    List<PetType>? ServesPetTypes, List<WorkingHourDto>? WorkingHours);

public record PlaceSummaryDto(Guid Id, PlaceType Type, string Name, string? Address, double Latitude, double Longitude,
    double? DistanceKm, bool IsOpen24h, List<PetType> ServesPetTypes, double? AvgRating, int ReviewCount);

public record PlaceDetailDto(Guid Id, PlaceType Type, string Name, string? Description, string? Address, string? City,
    string? WebsiteUrl, string? Phone, double Latitude, double Longitude, bool IsOpen24h, List<PetType> ServesPetTypes,
    List<WorkingHourDto> WorkingHours, double? AvgRating, int ReviewCount, Guid? OwnerId);

public record PetHomeDto(PetType PetType, List<string> Features, List<PlaceSummaryDto> Shops,
    List<PlaceSummaryDto> DogParks, List<PlaceSummaryDto> Vets, List<WalkerSummaryDto> Walkers);

// ---------- Walkers ----------
public record WalkerInput(string? Bio, decimal PricePerWalk, double ServiceRadiusKm, double Latitude, double Longitude, bool IsActive);
public record WalkerSummaryDto(Guid Id, string Name, string? Bio, decimal PricePerWalk, double ServiceRadiusKm,
    double Latitude, double Longitude, double? DistanceKm, double? AvgRating, int ReviewCount);
public record WalkRequestInput(Guid? PetId, string? Message, DateTimeOffset? PreferredTime);
public record RespondInput(bool Accept);
public record WalkRequestDto(Guid Id, Guid WalkerId, string WalkerName, Guid OwnerId, string OwnerName, string? PetName,
    PetType? PetType, string? Message, DateTime? PreferredTime, RequestStatus Status, DateTime CreatedAt, string? ContactPhone);

// ---------- Reviews ----------
public record ReviewInput(ReviewTargetType TargetType, Guid TargetId, int Rating, string? Comment);
public record ReviewUpdate(int Rating, string? Comment);
public record ReviewDto(Guid Id, Guid UserId, string UserName, ReviewTargetType TargetType, Guid TargetId,
    int Rating, string? Comment, DateTime CreatedAt, DateTime? UpdatedAt);

// ---------- Reminders ----------
public record ReminderInput(Guid? PetId, string Title, string? Notes, DateTimeOffset DueAt, RepeatInterval Repeat, string? TimeZoneId, bool IsDone = false);
public record ReminderDto(Guid Id, Guid? PetId, string Title, string? Notes, DateTime DueAtUtc, RepeatInterval Repeat, string? TimeZoneId, bool IsDone);

// ---------- Lost & found ----------
public record LostFoundInput(LostFoundType Type, PetType PetType, string Title, string? Description, string? PhotoUrl,
    double Latitude, double Longitude, string? ContactPhone);
public record LostFoundDto(Guid Id, LostFoundType Type, PetType PetType, string Title, string? Description, string? PhotoUrl,
    double Latitude, double Longitude, double? DistanceKm, string? ContactPhone, bool IsResolved, Guid UserId, string UserName, DateTime CreatedAt);

// ---------- Food check ----------
public record FoodCheckRequest(PetType PetType, string Food);
public record FoodCheckResponse(Verdict Verdict, AnswerSource Source, string Explanation, string DisclaimerKey,
    bool ShowVetWarning, string Language, string? MatchedFood);
public record FoodHistoryDto(PetType PetType, string Query, Verdict Verdict, AnswerSource Source, DateTime CreatedAt);