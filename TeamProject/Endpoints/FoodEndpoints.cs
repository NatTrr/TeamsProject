using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PetApp.Api.Common;
using PetApp.Api.Data;
using PetApp.Api.Domain;
using PetApp.Api.Dtos;
using PetApp.Api.Services;

namespace PetApp.Api.Endpoints;

public static class FoodEndpoints
{
    public static void MapFood(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/foodcheck").WithTags("Food check").RequireAuthorization();

        g.MapPost("/", async (FoodCheckRequest r, HttpRequest req, ClaimsPrincipal user, FoodCheckService svc) =>
        {
            if (!Enum.IsDefined(r.PetType)) return Err.Bad("pet.invalid_type");
            if (string.IsNullOrWhiteSpace(r.Food) || r.Food.Length > 100) return Err.Bad("foodcheck.invalid_food");
            return Results.Ok(await svc.CheckAsync(r.PetType, r.Food, Lang.From(req), user.Id()));
        }).RequireRateLimiting("food");

        g.MapGet("/history", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var items = await db.FoodChecks.AsNoTracking().Where(f => f.UserId == uid)
                .OrderByDescending(f => f.CreatedAt).Take(50)
                .Select(f => new FoodHistoryDto(f.PetType, f.Query, f.Verdict, f.Source, f.CreatedAt))
                .ToListAsync();
            return Results.Ok(items);
        });
    }
}