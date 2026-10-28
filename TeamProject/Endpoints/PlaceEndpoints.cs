using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PetApp.Api.Common;
using PetApp.Api.Data;
using PetApp.Api.Domain;
using PetApp.Api.Dtos;

namespace PetApp.Api.Endpoints;

public static class PlaceEndpoints
{
    public static void MapPlaces(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/places").WithTags("Places");

        // Public list: /places?type=Shop&petType=Dog&lat=41.99&lng=21.43&radiusKm=5&search=pet&page=1
        g.MapGet("/", async (AppDbContext db, PlaceType? type, PetType? petType, double? lat, double? lng,
            double? radiusKm, string? search, int page = 1, int pageSize = 20) =>
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);
            var types = type is null ? null : new[] { type.Value };
            var q = PlaceQuery.Filter(db, types, petType, lat, lng, radiusKm, search);

            var total = await q.CountAsync();
            var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            var ratings = await Ratings.ForAsync(db, ReviewTargetType.Place, items.Select(p => p.Id).ToList());
            var dtos = items.Select(p => PlaceMapper.Summary(p, lat, lng, ratings)).ToList();
            return Results.Ok(new PagedResult<PlaceSummaryDto>(dtos, page, pageSize, total));
        });

        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var p = await db.Places.AsNoTracking().Include(x => x.WorkingHours)
                .FirstOrDefaultAsync(x => x.Id == id && x.Status == PlaceStatus.Approved);
            if (p is null) return Err.NotFound("place.not_found");
            var ratings = await Ratings.ForAsync(db, ReviewTargetType.Place, new List<Guid> { p.Id });
            ratings.TryGetValue(p.Id, out var r);
            return Results.Ok(PlaceMapper.Detail(p, r));
        });

        // Shop owner area
        g.MapGet("/mine", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var items = await db.Places.AsNoTracking().Where(p => p.OwnerId == uid).OrderBy(p => p.Name).ToListAsync();
            var ratings = await Ratings.ForAsync(db, ReviewTargetType.Place, items.Select(p => p.Id).ToList());
            return Results.Ok(items.Select(p => PlaceMapper.Summary(p, null, null, ratings)).ToList());
        }).RequireAuthorization("ShopOwner");

        g.MapPost("/", async (PlaceInput i, ClaimsPrincipal user, AppDbContext db) =>
        {
            var error = PlaceMapper.Validate(i);
            if (error is not null) return Err.Bad(error);
            var place = PlaceMapper.Create(i, user.Id());
            db.Places.Add(place);
            await db.SaveChangesAsync();
            return Results.Created($"/places/{place.Id}", PlaceMapper.Detail(place, null));
        }).RequireAuthorization("ShopOwner");

        g.MapPut("/{id:guid}", async (Guid id, PlaceInput i, ClaimsPrincipal user, AppDbContext db) =>
        {
            var error = PlaceMapper.Validate(i);
            if (error is not null) return Err.Bad(error);
            var uid = user.Id();
            var p = await db.Places.Include(x => x.WorkingHours).FirstOrDefaultAsync(x => x.Id == id);
            if (p is null) return Err.NotFound("place.not_found");
            if (p.OwnerId != uid) return Err.Forbidden("place.not_owner");

            db.WorkingHours.RemoveRange(p.WorkingHours);
            PlaceMapper.Apply(p, i);
            await db.SaveChangesAsync();
            return Results.Ok(PlaceMapper.Detail(p, null));
        }).RequireAuthorization("ShopOwner");

        g.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var p = await db.Places.FirstOrDefaultAsync(x => x.Id == id);
            if (p is null) return Err.NotFound("place.not_found");
            if (p.OwnerId != uid) return Err.Forbidden("place.not_owner");
            db.Places.Remove(p);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("ShopOwner");
    }
}