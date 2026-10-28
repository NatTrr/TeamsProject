using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PetApp.Api.Common;
using PetApp.Api.Data;
using PetApp.Api.Domain;
using PetApp.Api.Dtos;

namespace PetApp.Api.Endpoints;

public static class PetEndpoints
{
    public static void MapPets(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/pets").WithTags("Pets").RequireAuthorization();

        g.MapGet("/", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var pets = await db.Pets.AsNoTracking().Where(p => p.OwnerId == uid).OrderBy(p => p.Name)
                .Select(p => new PetDto(p.Id, p.Name, p.Type, p.Breed, p.BirthDate, p.PhotoUrl))
                .ToListAsync();
            return Results.Ok(pets);
        });

        g.MapPost("/", async (PetInput i, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (!Enum.IsDefined(i.Type)) return Err.Bad("pet.invalid_type");
            var pet = new PetProfile
            {
                OwnerId = user.Id(), Type = i.Type,
                Name = string.IsNullOrWhiteSpace(i.Name) ? i.Type.ToString() : i.Name.Trim(),
                Breed = i.Breed, BirthDate = i.BirthDate, PhotoUrl = i.PhotoUrl
            };
            db.Pets.Add(pet);
            await db.SaveChangesAsync();
            return Results.Created($"/pets/{pet.Id}", new PetDto(pet.Id, pet.Name, pet.Type, pet.Breed, pet.BirthDate, pet.PhotoUrl));
        });

        g.MapPut("/{id:guid}", async (Guid id, PetInput i, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var pet = await db.Pets.FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == uid);
            if (pet is null) return Err.NotFound("pet.not_found");
            if (!Enum.IsDefined(i.Type)) return Err.Bad("pet.invalid_type");
            pet.Type = i.Type;
            pet.Name = string.IsNullOrWhiteSpace(i.Name) ? i.Type.ToString() : i.Name.Trim();
            pet.Breed = i.Breed; pet.BirthDate = i.BirthDate; pet.PhotoUrl = i.PhotoUrl;
            await db.SaveChangesAsync();
            return Results.Ok(new PetDto(pet.Id, pet.Name, pet.Type, pet.Breed, pet.BirthDate, pet.PhotoUrl));
        });

        g.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var pet = await db.Pets.FirstOrDefaultAsync(p => p.Id == id && p.OwnerId == uid);
            if (pet is null) return Err.NotFound("pet.not_found");
            db.Pets.Remove(pet);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}