using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PetApp.Api.Common;
using PetApp.Api.Data;
using PetApp.Api.Domain;
using PetApp.Api.Dtos;

namespace PetApp.Api.Endpoints;

public static class ReminderEndpoints
{
    static ReminderDto ToDto(Reminder r) =>
        new(r.Id, r.PetId, r.Title, r.Notes, r.DueAtUtc, r.Repeat, r.TimeZoneId, r.IsDone);

    static async Task<string?> ValidateAsync(ReminderInput i, Guid uid, AppDbContext db)
    {
        if (string.IsNullOrWhiteSpace(i.Title) || i.Title.Length > 200) return "reminder.invalid_title";
        if (!Enum.IsDefined(i.Repeat)) return "reminder.invalid_repeat";
        if (i.PetId is not null)
        {
            var petId = i.PetId.Value;
            if (!await db.Pets.AnyAsync(p => p.Id == petId && p.OwnerId == uid)) return "pet.not_found";
        }
        return null;
    }

    public static void MapReminders(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/reminders").WithTags("Reminders").RequireAuthorization();

        g.MapGet("/", async (ClaimsPrincipal user, AppDbContext db, bool includeDone = false) =>
        {
            var uid = user.Id();
            var q = db.Reminders.AsNoTracking().Where(r => r.UserId == uid);
            if (!includeDone) q = q.Where(r => !r.IsDone);
            var list = await q.OrderBy(r => r.DueAtUtc).ToListAsync();
            return Results.Ok(list.Select(ToDto).ToList());
        });

        g.MapPost("/", async (ReminderInput i, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var error = await ValidateAsync(i, uid, db);
            if (error is not null) return Err.Bad(error);
            var r = new Reminder
            {
                UserId = uid, PetId = i.PetId, Title = i.Title.Trim(), Notes = i.Notes,
                DueAtUtc = i.DueAt.UtcDateTime, Repeat = i.Repeat, TimeZoneId = i.TimeZoneId, IsDone = i.IsDone
            };
            db.Reminders.Add(r);
            await db.SaveChangesAsync();
            return Results.Created($"/reminders/{r.Id}", ToDto(r));
        });

        g.MapPut("/{id:guid}", async (Guid id, ReminderInput i, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var r = await db.Reminders.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
            if (r is null) return Err.NotFound("reminder.not_found");
            var error = await ValidateAsync(i, uid, db);
            if (error is not null) return Err.Bad(error);
            r.PetId = i.PetId; r.Title = i.Title.Trim(); r.Notes = i.Notes;
            r.DueAtUtc = i.DueAt.UtcDateTime; r.Repeat = i.Repeat; r.TimeZoneId = i.TimeZoneId; r.IsDone = i.IsDone;
            await db.SaveChangesAsync();
            return Results.Ok(ToDto(r));
        });

        g.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var uid = user.Id();
            var r = await db.Reminders.FirstOrDefaultAsync(x => x.Id == id && x.UserId == uid);
            if (r is null) return Err.NotFound("reminder.not_found");
            db.Reminders.Remove(r);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}