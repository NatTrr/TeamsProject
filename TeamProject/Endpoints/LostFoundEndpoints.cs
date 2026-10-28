using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PetApp.Api.Common;
using PetApp.Api.Data;
using PetApp.Api.Domain;
using PetApp.Api.Dtos;

namespace PetApp.Api.Endpoints;

public static class LostFoundEndpoints
{
    static LostFoundDto ToDto(LostFoundPost p, double? lat, double? lng)
    {
        double? dist = null;
        if (lat is not null && lng is not null)
            dist = Math.Round(Geo.DistanceKm(lat.Value, lng.Value, p.Location.Y, p.Location.X), 2);
        return new LostFoundDto(p.Id, p.Type, p.PetType, p.Title, p.Description, p.PhotoUrl, p.Location.Y, p.Location.X,
            dist, p.ContactPhone, p.IsResolved, p.UserId, p.User.FullName, p.CreatedAt);
    }

    static string? Validate(LostFoundInput i)
    {
        if (!Enum.IsDefined(i.Type) || !Enum.IsDefined(i.PetType)) return "lostfound.invalid_type";
        if (string.IsNullOrWhiteSpace(i.Title) || i.Title.Length > 200) return "lostfound.invalid_title";
        if (!Geo.Valid(i.Latitude, i.Longitude)) return "lostfound.invalid_location";
        return null;
    }

    public static void MapLostFound(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/lostfound").WithTags("Lost and found");

        g.MapGet("/", async (AppDbContext db, LostFoundType? type, PetType? petType, double? lat, double? lng,
            double? radiusKm, bool includeResolved = false, int page = 1, int pageSize = 20) =>
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);
            IQueryable<LostFoundPost> q = db.LostFound.AsNoTracking().Include(x => x.User);
            if (!includeResolved) q = q.Where(x => !x.IsResolved);
            if (type is not null) { var t = type.Value; q = q.Where(x => x.Type == t); }
            if (petType is not null) { var pt = petType.Value; q = q.Where(x => x.PetType == pt); }
            if (lat is not null && lng is not null && radiusKm is not null && Geo.Valid(lat.Value, lng.Value))
            {
                var me = Geo.ToPoint(lat.Value, lng.Value);
                var meters = radiusKm.Value * 1000;
                q = q.Where(x => x.Location.IsWithinDistance(me, meters));
            }
            q = q.OrderByDescending(x => x.CreatedAt);

            var total = await q.CountAsync();
            var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return Results.Ok(new PagedResult<LostFoundDto>(items.Select(p => ToDto(p, lat, lng)).ToList(), page, pageSize, total));
        });

        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var p = await db.LostFound.AsNoTracking().Include(x => x.User).FirstOrDefaultAsync(x => x.Id == id);
            return p is null ? Err.NotFound("lostfound.not_found") : Results.Ok(ToDto(p, null, null));
        });

        g.MapPost("/", async (LostFoundInput i, ClaimsPrincipal user, AppDbContext db) =>
        {
            var error = Validate(i);
            if (error is not null) return Err.Bad(error);
            var post = new LostFoundPost
            {
                UserId = user.Id(), Type = i.Type, PetType = i.PetType, Title = i.Title.Trim(), Description = i.Description,
                PhotoUrl = i.PhotoUrl, Location = Geo.ToPoint(i.Latitude, i.Longitude), ContactPhone = i.ContactPhone
            };
            db.LostFound.Add(post);
            await db.SaveChangesAsync();
            await db.Entry(post).Reference(x => x.User).LoadAsync();
            return Results.Created($"/lostfound/{post.Id}", ToDto(post, null, null));
        }).RequireAuthorization();

        g.MapPut("/{id:guid}", async (Guid id, LostFoundInput i, ClaimsPrincipal user, AppDbContext db) =>
        {
            var error = Validate(i);
            if (error is not null) return Err.Bad(error);
            var uid = user.Id();
            var post = await db.LostFound.Include(x => x.User).FirstOrDefaultAsync(x => x.Id == id);
            if (post is null) return Err.NotFound("lostfound.not_found");
            if (post.UserId != uid) return Err.Forbidden("lostfound.not_owner");
            post.Type = i.Type; post.PetType = i.PetType; post.Title = i.Title.Trim(); post.Description = i.Description;
            post.PhotoUrl = i.PhotoUrl; post.ContactPhone = i.ContactPhone;
            post.Location = Geo.ToPoint(i.Latitude, i.Longitude);
            await db.SaveChangesAsync();
            return Results.Ok(ToDto(post, null, null));
        }).RequireAuthorization();

        g.MapPost("/{id:guid}/resolve", async (Guid id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var post = await db.LostFound.FirstOrDefaultAsync(x => x.Id == id);
            if (post is null) return Err.NotFound("lostfound.not_found");
            if (post.UserId != uid) return Err.Forbidden("lostfound.not_owner");
            post.IsResolved = true;
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization();

        g.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var post = await db.LostFound.FirstOrDefaultAsync(x => x.Id == id);
            if (post is null) return Err.NotFound("lostfound.not_found");
            if (post.UserId != uid) return Err.Forbidden("lostfound.not_owner");
            db.LostFound.Remove(post);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization();
    }
}