using Microsoft.EntityFrameworkCore;
using PetApp.Api.Common;
using PetApp.Api.Data;
using PetApp.Api.Domain;
using PetApp.Api.Dtos;

namespace PetApp.Api.Endpoints;

public static class DiscoveryEndpoints
{
    public static void MapDiscovery(this IEndpointRouteBuilder app)
    {
        app.MapGet("/home/{petType}", async (PetType petType, AppDbContext db, double? lat, double? lng, double? radiusKm) =>
        {
            if (!Enum.IsDefined(petType)) return Err.Bad("pet.invalid_type");
            if (lat is not null && lng is not null) radiusKm ??= 25;

            var features = PetFeatures.For(petType);

            async Task<List<PlaceSummaryDto>> Nearby(PetFeature feature, params PlaceType[] types)
            {
                if (!features.Contains(feature)) return new List<PlaceSummaryDto>();
                var items = await PlaceQuery.Filter(db, types, petType, lat, lng, radiusKm, null).Take(10).ToListAsync();
                var ratings = await Ratings.ForAsync(db, ReviewTargetType.Place, items.Select(p => p.Id).ToList());
                return items.Select(p => PlaceMapper.Summary(p, lat, lng, ratings)).ToList();
            }

            var shops = await Nearby(PetFeature.Shops, PlaceType.Shop);
            var parks = await Nearby(PetFeature.DogParks, PlaceType.DogPark);
            var vets = await Nearby(PetFeature.Vets, PlaceType.Vet, PlaceType.EmergencyVet);
            var walkers = features.Contains(PetFeature.Walkers)
                ? await WalkerEndpoints.NearbyAsync(db, lat, lng, radiusKm, 10)
                : new List<WalkerSummaryDto>();

            return Results.Ok(new PetHomeDto(petType, features.Select(f => f.ToString()).ToList(), shops, parks, vets, walkers));
        }).WithTags("Discovery");

        app.MapGet("/map/pins", async (AppDbContext db, PlaceType? type, PetType? petType, double? lat, double? lng, double? radiusKm) =>
        {
            var types = type is null ? null : new[] { type.Value };
            var rows = await PlaceQuery.Filter(db, types, petType, lat, lng, radiusKm, null)
                .Select(p => new { p.Id, p.Name, p.Type, p.Location })
                .Take(2000)
                .ToListAsync();

            var geo = new
            {
                type = "FeatureCollection",
                features = rows.Select(p => new
                {
                    type = "Feature",
                    id = p.Id,
                    geometry = new { type = "Point", coordinates = new[] { p.Location.X, p.Location.Y } },
                    properties = new { id = p.Id, name = p.Name, placeType = p.Type }
                }).ToList()
            };
            return Results.Ok(geo);
        }).WithTags("Discovery");
    }
}