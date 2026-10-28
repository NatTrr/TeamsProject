using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using PetApp.Api.Data;
using PetApp.Api.Domain;
using PetApp.Api.Dtos;

namespace PetApp.Api.Services;

public class TokenService(IConfiguration cfg, AppDbContext db, UserManager<ApplicationUser> users)
{
    public async Task<AuthResponse> IssueAsync(ApplicationUser user)
    {
        var roles = await users.GetRolesAsync(user);
        var expires = DateTime.UtcNow.AddMinutes(cfg.GetValue("Jwt:AccessMinutes", 30));

        var claims = new List<Claim>
        {
            new("sub", user.Id.ToString()),
            new("email", user.Email ?? ""),
            new("name", user.FullName)
        };
        claims.AddRange(roles.Select(r => new Claim("role", r)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expires,
            Issuer = cfg["Jwt:Issuer"],
            Audience = cfg["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        };
        var access = new JsonWebTokenHandler().CreateToken(descriptor);

        var raw = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = Hash(raw),
            ExpiresAt = DateTime.UtcNow.AddDays(cfg.GetValue("Jwt:RefreshDays", 30))
        });
        await db.SaveChangesAsync();

        return new AuthResponse(access, raw, expires, ToDto(user, roles));
    }

    public async Task<AuthResponse?> RefreshAsync(string raw)
    {
        var hash = Hash(raw);
        var token = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (token is null || token.RevokedAt is not null || token.ExpiresAt < DateTime.UtcNow) return null;

        var user = await users.FindByIdAsync(token.UserId.ToString());
        if (user is null) return null;

        token.RevokedAt = DateTime.UtcNow;      // rotation: old token can't be reused
        return await IssueAsync(user);          // also saves the revoke
    }

    public async Task RevokeAsync(string raw)
    {
        var hash = Hash(raw);
        var token = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (token is null) return;
        token.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public static UserDto ToDto(ApplicationUser u, IEnumerable<string> roles) =>
        new(u.Id, u.Email ?? "", u.FullName, u.PhoneNumber, u.City, roles.ToList());

    static string Hash(string s) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(s)));
}