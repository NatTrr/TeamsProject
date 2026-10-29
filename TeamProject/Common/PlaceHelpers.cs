using Microsoft.EntityFrameworkCore;
using PetApp.Api.Data;
using PetApp.Api.Domain;
using PetApp.Api.Dtos;

namespace PetApp.Api.Common;

public static class PetFeatures
{

    static readonly Dictionary<PetType, PetFeature[]> Map = new()
    {
        [PetType.Dog] = new[] { PetFeature.Shops, PetFeature.DogParks, PetFeature.Vets, PetFeature.Walkers, PetFeature.FoodCheck },
        [PetType.Cat] = new[] { PetFeature.Shops, PetFeature.Vets, PetFeature.FoodCheck },
        [PetType.Parrot] = new[] { PetFeature.FoodCheck },
        [PetType.Hamster] = new[] { PetFeature.FoodCheck },
    };

    public static PetFeature[] For(PetType t) => Map.TryGetValue(t, out var f) ? f : Array.Empty<PetFeature>();
}

public record RatingInfo(double Avg, int Count);

public static class Ratings
{
    public static async Task<Dictionary<Guid, RatingInfo>> ForAsync(AppDbContext db, ReviewTargetType type, List<Guid> ids)
    {
        if (ids.Count == 0) return new();
        var rows = await db.Reviews.AsNoTracking()
            .Where(r => r.TargetType == type && ids.Contains(r.TargetId))
            .GroupBy(r => r.TargetId)
            .Select(g => new { Id = g.Key, Avg = g.Average(r => (double)r.Rating), Count = g.Count() })
            .ToListAsync();
        return rows.ToDictionary(x => x.Id, x => new RatingInfo(x.Avg, x.Count));
    }
}

public static class PlaceQuery
{

    public static IQueryable<Place> Filter(AppDbContext db, IReadOnlyCollection<PlaceType>? types, PetType? petType,
        double? lat, double? lng, double? radiusKm, string? search)
    {
        IQueryable<Place> q = db.Places.AsNoTracking().Where(p => p.Status == PlaceStatus.Approved);

        if (types is { Count: > 0 })
        {
            var list = types.ToList();
            q = q.Where(p => list.Contains(p.Type));
        }
        if (petType is not null)
        {
            var pt = petType.Value;
            q = q.Where(p => p.ServesPetTypes.Contains(pt));
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(p => p.Name.ToLower().Contains(s));
        }
        if (lat is not null && lng is not null && Geo.Valid(lat.Value, lng.Value))
        {
            var me = Geo.ToPoint(lat.Value, lng.Value);
            if (radiusKm is not null)
            {
                var meters = radiusKm.Value * 1000;
                q = q.Where(p => p.Location.IsWithinDistance(me, meters));
            }
            return q.OrderBy(p => p.Location.Distance(me));
        }
        return q.OrderBy(p => p.Name);
    }
}

public static class PlaceMapper
{
    public static string? Validate(PlaceInput i)
    {
        // Shop owners can add shops and vets. Dog parks come from the seed data (no admin in this version).
        if (!Enum.IsDefined(i.Type) || i.Type == PlaceType.DogPark) return "place.invalid_type";
        if (string.IsNullOrWhiteSpace(i.Name) || i.Name.Length > 200) return "place.invalid_name";
        if (!Geo.Valid(i.Latitude, i.Longitude)) return "place.invalid_location";
        if (!string.IsNullOrWhiteSpace(i.WebsiteUrl) &&
            !(Uri.TryCreate(i.WebsiteUrl.Trim(), UriKind.Absolute, out var u) && (u.Scheme == "http" || u.Scheme == "https")))
            return "place.invalid_website";
        return null;
    }

    public static void Apply(Place p, PlaceInput i)
    {
        p.Type = i.Type;
        p.Name = i.Name.Trim();
        p.Description = i.Description;
        p.Address = i.Address;
        p.City = i.City;
        p.WebsiteUrl = string.IsNullOrWhiteSpace(i.WebsiteUrl) ? null : i.WebsiteUrl.Trim();
        p.Phone = i.Phone;
        p.IsOpen24h = i.IsOpen24h;
        p.Location = Geo.ToPoint(i.Latitude, i.Longitude);

        List<PetType> serves;
        if (i.ServesPetTypes is { Count: > 0 })
            serves = i.ServesPetTypes.Where(t => Enum.IsDefined(t)).Distinct().ToList();
        else if (i.Type == PlaceType.DogPark)
            serves = new List<PetType> { PetType.Dog };
        else
            serves = Enum.GetValues<PetType>().ToList();
        p.ServesPetTypes = serves;

        p.WorkingHours = (i.WorkingHours ?? new List<WorkingHourDto>())
            .Select(w => new WorkingHour { Day = w.Day, Opens = w.Opens, Closes = w.Closes })
            .ToList();
    }

    public static Place Create(PlaceInput i, Guid? ownerId)
    {
        var p = new Place { OwnerId = ownerId };
        Apply(p, i);
        return p;
    }

    public static PlaceSummaryDto Summary(Place p, double? lat, double? lng, Dictionary<Guid, RatingInfo> ratings)
    {
        ratings.TryGetValue(p.Id, out var r);
        double? dist = null;
        if (lat is not null && lng is not null)
            dist = Math.Round(Geo.DistanceKm(lat.Value, lng.Value, p.Location.Y, p.Location.X), 2);
        double? avg = r is null ? null : Math.Round(r.Avg, 1);
        return new PlaceSummaryDto(p.Id, p.Type, p.Name, p.Address, p.Location.Y, p.Location.X, dist,
            p.IsOpen24h, p.ServesPetTypes, avg, r?.Count ?? 0);
    }

    public static PlaceDetailDto Detail(Place p, RatingInfo? r)
    {
        double? avg = r is null ? null : Math.Round(r.Avg, 1);
        return new PlaceDetailDto(p.Id, p.Type, p.Name, p.Description, p.Address, p.City, p.WebsiteUrl, p.Phone,
            p.Location.Y, p.Location.X, p.IsOpen24h, p.ServesPetTypes,
            p.WorkingHours.OrderBy(w => w.Day).Select(w => new WorkingHourDto(w.Day, w.Opens, w.Closes)).ToList(),
            avg, r?.Count ?? 0, p.OwnerId);
    }
}