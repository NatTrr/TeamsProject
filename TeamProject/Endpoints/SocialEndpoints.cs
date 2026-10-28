using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PetApp.Api.Common;
using PetApp.Api.Data;
using PetApp.Api.Domain;
using PetApp.Api.Dtos;

namespace PetApp.Api.Endpoints;

public static class SocialEndpoints
{
    public static void MapSocial(this IEndpointRouteBuilder app)
    {
        // ---------------- Reviews ----------------
        var rv = app.MapGroup("/reviews").WithTags("Reviews");

        rv.MapGet("/", async (AppDbContext db, ReviewTargetType targetType, Guid targetId, int page = 1, int pageSize = 20) =>
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);
            var q = db.Reviews.AsNoTracking().Where(r => r.TargetType == targetType && r.TargetId == targetId)
                .OrderByDescending(r => r.CreatedAt);
            var total = await q.CountAsync();
            var items = await q.Skip((page - 1) * pageSize).Take(pageSize)
                .Select(r => new ReviewDto(r.Id, r.UserId, r.User.FullName, r.TargetType, r.TargetId,
                    r.Rating, r.Comment, r.CreatedAt, r.UpdatedAt))
                .ToListAsync();
            return Results.Ok(new PagedResult<ReviewDto>(items, page, pageSize, total));
        });

        rv.MapPost("/", async (ReviewInput i, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (i.Rating < 1 || i.Rating > 5) return Err.Bad("review.invalid_rating");
            if (i.Comment is { Length: > 1000 }) return Err.Bad("review.comment_too_long");
            if (!Enum.IsDefined(i.TargetType)) return Err.Bad("review.invalid_target");

            var uid = user.Id();
            var targetType = i.TargetType;
            var targetId = i.TargetId;
            Guid? targetOwner;

            if (targetType == ReviewTargetType.Place)
            {
                var place = await db.Places.AsNoTracking().Where(x => x.Id == targetId)
                    .Select(x => new { x.OwnerId }).FirstOrDefaultAsync();
                if (place is null) return Err.NotFound("place.not_found");
                targetOwner = place.OwnerId;
            }
            else
            {
                var walker = await db.Walkers.AsNoTracking().Where(x => x.Id == targetId)
                    .Select(x => new { x.UserId }).FirstOrDefaultAsync();
                if (walker is null) return Err.NotFound("walker.not_found");
                targetOwner = walker.UserId;
            }

            if (targetOwner == uid) return Err.Bad("review.own_target");
            if (await db.Reviews.AnyAsync(r => r.UserId == uid && r.TargetType == targetType && r.TargetId == targetId))
                return Err.Conflict("review.already_exists");

            var review = new Review
            {
                UserId = uid, TargetType = targetType, TargetId = targetId,
                Rating = i.Rating, Comment = i.Comment?.Trim()
            };
            db.Reviews.Add(review);
            await db.SaveChangesAsync();
            return Results.Created($"/reviews/{review.Id}",
                new ReviewDto(review.Id, uid, user.FindFirst("name")?.Value ?? "", review.TargetType, review.TargetId,
                    review.Rating, review.Comment, review.CreatedAt, review.UpdatedAt));
        }).RequireAuthorization();

        rv.MapPut("/{id:guid}", async (Guid id, ReviewUpdate i, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (i.Rating < 1 || i.Rating > 5) return Err.Bad("review.invalid_rating");
            if (i.Comment is { Length: > 1000 }) return Err.Bad("review.comment_too_long");
            var uid = user.Id();
            var r = await db.Reviews.FirstOrDefaultAsync(x => x.Id == id);
            if (r is null) return Err.NotFound("review.not_found");
            if (r.UserId != uid) return Err.Forbidden("review.not_owner");
            r.Rating = i.Rating;
            r.Comment = i.Comment?.Trim();
            r.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            return Results.Ok(new ReviewDto(r.Id, r.UserId, user.FindFirst("name")?.Value ?? "", r.TargetType, r.TargetId,
                r.Rating, r.Comment, r.CreatedAt, r.UpdatedAt));
        }).RequireAuthorization();

        rv.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var r = await db.Reviews.FirstOrDefaultAsync(x => x.Id == id);
            if (r is null) return Err.NotFound("review.not_found");
            if (r.UserId != uid) return Err.Forbidden("review.not_owner");
            db.Reviews.Remove(r);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization();

        // ---------------- Favorites ----------------
        var fav = app.MapGroup("/favorites").WithTags("Favorites").RequireAuthorization();

        fav.MapGet("/", async (ClaimsPrincipal user, AppDbContext db, double? lat, double? lng) =>
        {
            var uid = user.Id();
            var places = await db.Favorites.AsNoTracking().Where(f => f.UserId == uid && f.Place.Status == PlaceStatus.Approved)
                .OrderByDescending(f => f.CreatedAt).Select(f => f.Place).ToListAsync();
            var ratings = await Ratings.ForAsync(db, ReviewTargetType.Place, places.Select(p => p.Id).ToList());
            return Results.Ok(places.Select(p => PlaceMapper.Summary(p, lat, lng, ratings)).ToList());
        });

        fav.MapPut("/{placeId:guid}", async (Guid placeId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            if (!await db.Places.AnyAsync(p => p.Id == placeId)) return Err.NotFound("place.not_found");
            if (!await db.Favorites.AnyAsync(f => f.UserId == uid && f.PlaceId == placeId))
            {
                db.Favorites.Add(new Favorite { UserId = uid, PlaceId = placeId });
                await db.SaveChangesAsync();
            }
            return Results.NoContent();
        });

        fav.MapDelete("/{placeId:guid}", async (Guid placeId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var f = await db.Favorites.FirstOrDefaultAsync(x => x.UserId == uid && x.PlaceId == placeId);
            if (f is not null)
            {
                db.Favorites.Remove(f);
                await db.SaveChangesAsync();
            }
            return Results.NoContent();
        });
    }
}