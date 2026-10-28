using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using PetApp.Api.Common;
using PetApp.Api.Data;
using PetApp.Api.Domain;
using PetApp.Api.Dtos;
using PetApp.Api.Services;

namespace PetApp.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuth(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/auth").WithTags("Auth");

        g.MapPost("/register/owner", async (RegisterOwnerRequest r, UserManager<ApplicationUser> users, AppDbContext db, TokenService tokens) =>
        {
            if (!Check.IsEmail(r.Email)) return Err.Bad("auth.invalid_email");
            if (string.IsNullOrWhiteSpace(r.FullName)) return Err.Bad("auth.name_required");

            var user = new ApplicationUser
            {
                UserName = r.Email.Trim(), Email = r.Email.Trim(), FullName = r.FullName.Trim(),
                PhoneNumber = r.Phone, City = r.City
            };
            var result = await users.CreateAsync(user, r.Password ?? "");
            if (!result.Succeeded) return Err.Bad("auth.registration_failed", string.Join(",", result.Errors.Select(e => e.Code)));
            await users.AddToRoleAsync(user, Roles.Owner);

            foreach (var p in r.Pets ?? new List<PetInput>())
            {
                if (!Enum.IsDefined(p.Type)) continue;
                db.Pets.Add(new PetProfile
                {
                    OwnerId = user.Id, Type = p.Type,
                    Name = string.IsNullOrWhiteSpace(p.Name) ? p.Type.ToString() : p.Name.Trim(),
                    Breed = p.Breed, BirthDate = p.BirthDate, PhotoUrl = p.PhotoUrl
                });
            }
            await db.SaveChangesAsync();
            return Results.Ok(await tokens.IssueAsync(user));
        });

        g.MapPost("/register/shop", async (RegisterShopRequest r, UserManager<ApplicationUser> users, AppDbContext db, TokenService tokens) =>
        {
            if (!Check.IsEmail(r.Email)) return Err.Bad("auth.invalid_email");
            if (string.IsNullOrWhiteSpace(r.FullName)) return Err.Bad("auth.name_required");
            if (r.Shop is not null)
            {
                var error = PlaceMapper.Validate(r.Shop);
                if (error is not null) return Err.Bad(error);
            }

            var user = new ApplicationUser
            {
                UserName = r.Email.Trim(), Email = r.Email.Trim(), FullName = r.FullName.Trim(),
                PhoneNumber = r.Phone, City = r.City
            };
            var result = await users.CreateAsync(user, r.Password ?? "");
            if (!result.Succeeded) return Err.Bad("auth.registration_failed", string.Join(",", result.Errors.Select(e => e.Code)));
            await users.AddToRoleAsync(user, Roles.ShopOwner);

            if (r.Shop is not null)
            {
                db.Places.Add(PlaceMapper.Create(r.Shop, user.Id));
                await db.SaveChangesAsync();
            }
            return Results.Ok(await tokens.IssueAsync(user));
        });

        g.MapPost("/login", async (LoginRequest r, UserManager<ApplicationUser> users, TokenService tokens) =>
        {
            var user = await users.FindByEmailAsync(r.Email ?? "");
            if (user is null || !await users.CheckPasswordAsync(user, r.Password ?? ""))
                return Err.Unauthorized("auth.invalid_credentials");
            return Results.Ok(await tokens.IssueAsync(user));
        });

        g.MapPost("/refresh", async (RefreshRequest r, TokenService tokens) =>
        {
            var res = await tokens.RefreshAsync(r.RefreshToken ?? "");
            return res is null ? Err.Unauthorized("auth.invalid_refresh_token") : Results.Ok(res);
        });

        g.MapPost("/logout", async (RefreshRequest r, TokenService tokens) =>
        {
            await tokens.RevokeAsync(r.RefreshToken ?? "");
            return Results.NoContent();
        });

        var me = app.MapGroup("/me").WithTags("Profile").RequireAuthorization();

        me.MapGet("/", async (ClaimsPrincipal principal, UserManager<ApplicationUser> users) =>
        {
            var user = await users.FindByIdAsync(principal.Id().ToString());
            if (user is null) return Err.NotFound("auth.user_not_found");
            return Results.Ok(TokenService.ToDto(user, await users.GetRolesAsync(user)));
        });

        me.MapPut("/", async (UpdateProfileRequest r, ClaimsPrincipal principal, UserManager<ApplicationUser> users) =>
        {
            var user = await users.FindByIdAsync(principal.Id().ToString());
            if (user is null) return Err.NotFound("auth.user_not_found");
            if (string.IsNullOrWhiteSpace(r.FullName)) return Err.Bad("auth.name_required");
            user.FullName = r.FullName.Trim();
            user.PhoneNumber = r.Phone;
            user.City = r.City;
            await users.UpdateAsync(user);
            return Results.Ok(TokenService.ToDto(user, await users.GetRolesAsync(user)));
        });
    }
}