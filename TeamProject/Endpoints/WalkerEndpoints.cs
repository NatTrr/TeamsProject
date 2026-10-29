using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PetApp.Api.Common;
using PetApp.Api.Data;
using PetApp.Api.Domain;
using PetApp.Api.Dtos;

namespace PetApp.Api.Endpoints;

public static class WalkerEndpoints
{
    public static async Task<List<WalkerSummaryDto>> NearbyAsync(AppDbContext db, double? lat, double? lng, double? radiusKm, int take)
    {
        IQueryable<WalkerProfile> q = db.Walkers.AsNoTracking().Include(w => w.User).Where(w => w.IsActive);

        if (lat is not null && lng is not null && Geo.Valid(lat.Value, lng.Value))
        {
            var me = Geo.ToPoint(lat.Value, lng.Value);
            if (radiusKm is not null)
            {
                var meters = radiusKm.Value * 1000;
                q = q.Where(w => w.ApproxLocation.IsWithinDistance(me, meters));
            }
            q = q.OrderBy(w => w.ApproxLocation.Distance(me));
        }
        else q = q.OrderBy(w => w.User.FullName);

        var list = await q.Take(take).ToListAsync();
        var ratings = await Ratings.ForAsync(db, ReviewTargetType.Walker, list.Select(w => w.Id).ToList());
        return list.Select(w => Map(w, lat, lng, ratings)).ToList();
    }

    static WalkerSummaryDto Map(WalkerProfile w, double? lat, double? lng, Dictionary<Guid, RatingInfo> ratings)
    {
        ratings.TryGetValue(w.Id, out var r);
        double? dist = null;
        if (lat is not null && lng is not null)
            dist = Math.Round(Geo.DistanceKm(lat.Value, lng.Value, w.ApproxLocation.Y, w.ApproxLocation.X), 2);
        double? avg = r is null ? null : Math.Round(r.Avg, 1);
        return new WalkerSummaryDto(w.Id, w.User.FullName, w.Bio, w.PricePerWalk, w.ServiceRadiusKm,
            w.ApproxLocation.Y, w.ApproxLocation.X, dist, avg, r?.Count ?? 0);
    }

    static WalkRequestDto MapRequest(WalkRequest r, bool viewerIsWalker)
    {
        string? contact = null;
        if (r.Status == RequestStatus.Accepted)
            contact = viewerIsWalker ? r.Owner.PhoneNumber : r.Walker.User.PhoneNumber;
        return new WalkRequestDto(r.Id, r.WalkerProfileId, r.Walker.User.FullName, r.OwnerId, r.Owner.FullName,
            r.Pet?.Name, r.Pet?.Type, r.Message, r.PreferredTime, r.Status, r.CreatedAt, contact);
    }

    public static void MapWalkers(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/walkers").WithTags("Walkers");

        g.MapGet("/", async (AppDbContext db, double? lat, double? lng, double? radiusKm) =>
            Results.Ok(await NearbyAsync(db, lat, lng, radiusKm, 50)));

        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var w = await db.Walkers.AsNoTracking().Include(x => x.User).FirstOrDefaultAsync(x => x.Id == id && x.IsActive);
            if (w is null) return Err.NotFound("walker.not_found");
            var ratings = await Ratings.ForAsync(db, ReviewTargetType.Walker, new List<Guid> { w.Id });
            return Results.Ok(Map(w, null, null, ratings));
        });

        g.MapGet("/me", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var w = await db.Walkers.AsNoTracking().Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid);
            if (w is null) return Err.NotFound("walker.not_found");
            var ratings = await Ratings.ForAsync(db, ReviewTargetType.Walker, new List<Guid> { w.Id });
            return Results.Ok(Map(w, null, null, ratings));
        }).RequireAuthorization("Owner");

        g.MapPut("/me", async (WalkerInput i, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (!Geo.Valid(i.Latitude, i.Longitude)) return Err.Bad("walker.invalid_location");
            if (i.PricePerWalk < 0 || i.PricePerWalk > 10000 || i.ServiceRadiusKm <= 0 || i.ServiceRadiusKm > 100)
                return Err.Bad("walker.invalid_values");

            var uid = user.Id();
            var w = await db.Walkers.FirstOrDefaultAsync(x => x.UserId == uid);
            if (w is null)
            {
                w = new WalkerProfile { UserId = uid };
                db.Walkers.Add(w);
            }
            w.Bio = i.Bio;
            w.PricePerWalk = i.PricePerWalk;
            w.ServiceRadiusKm = i.ServiceRadiusKm;
            w.IsActive = i.IsActive;
            // Privacy: store an approximate location (about 1 km), never the exact home address
            w.ApproxLocation = Geo.ToPoint(Math.Round(i.Latitude, 2), Math.Round(i.Longitude, 2));
            await db.SaveChangesAsync();

            await db.Entry(w).Reference(x => x.User).LoadAsync();
            return Results.Ok(Map(w, null, null, new Dictionary<Guid, RatingInfo>()));
        }).RequireAuthorization("Owner");

        g.MapPost("/{id:guid}/requests", async (Guid id, WalkRequestInput i, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var walker = await db.Walkers.FirstOrDefaultAsync(x => x.Id == id && x.IsActive);
            if (walker is null) return Err.NotFound("walker.not_found");
            if (walker.UserId == uid) return Err.Bad("walker.cannot_request_self");

            if (i.PetId is not null)
            {
                var petId = i.PetId.Value;
                if (!await db.Pets.AnyAsync(p => p.Id == petId && p.OwnerId == uid)) return Err.Bad("pet.not_found");
            }
            if (i.Message is { Length: > 1000 }) return Err.Bad("request.message_too_long");

            var req = new WalkRequest
            {
                WalkerProfileId = id, OwnerId = uid, PetId = i.PetId, Message = i.Message,
                PreferredTime = i.PreferredTime?.UtcDateTime
            };
            db.WalkRequests.Add(req);
            await db.SaveChangesAsync();
            return Results.Created($"/walker-requests/{req.Id}", new { req.Id, req.Status });
        }).RequireAuthorization("Owner");

        var rq = app.MapGroup("/walker-requests").WithTags("Walker requests").RequireAuthorization();

        rq.MapGet("/incoming", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var list = await db.WalkRequests.AsNoTracking()
                .Include(r => r.Walker).ThenInclude(w => w.User)
                .Include(r => r.Owner).Include(r => r.Pet)
                .Where(r => r.Walker.UserId == uid)
                .OrderByDescending(r => r.CreatedAt).ToListAsync();
            return Results.Ok(list.Select(r => MapRequest(r, true)).ToList());
        });

        rq.MapGet("/sent", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var list = await db.WalkRequests.AsNoTracking()
                .Include(r => r.Walker).ThenInclude(w => w.User)
                .Include(r => r.Owner).Include(r => r.Pet)
                .Where(r => r.OwnerId == uid)
                .OrderByDescending(r => r.CreatedAt).ToListAsync();
            return Results.Ok(list.Select(r => MapRequest(r, false)).ToList());
        });

        rq.MapPost("/{id:guid}/respond", async (Guid id, RespondInput i, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var r = await db.WalkRequests.Include(x => x.Walker).FirstOrDefaultAsync(x => x.Id == id && x.Walker.UserId == uid);
            if (r is null) return Err.NotFound("request.not_found");
            if (r.Status != RequestStatus.Pending) return Err.Conflict("request.already_answered");
            r.Status = i.Accept ? RequestStatus.Accepted : RequestStatus.Declined;
            await db.SaveChangesAsync();
            return Results.Ok(new { r.Id, r.Status });
        });
    }
}