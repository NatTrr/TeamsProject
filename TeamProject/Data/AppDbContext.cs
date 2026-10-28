using System.Linq.Expressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PetApp.Api.Domain;

namespace PetApp.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PetProfile> Pets => Set<PetProfile>();
    public DbSet<Place> Places => Set<Place>();
    public DbSet<WorkingHour> WorkingHours => Set<WorkingHour>();
    public DbSet<WalkerProfile> Walkers => Set<WalkerProfile>();
    public DbSet<WalkRequest> WalkRequests => Set<WalkRequest>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<Reminder> Reminders => Set<Reminder>();
    public DbSet<LostFoundPost> LostFound => Set<LostFoundPost>();
    public DbSet<FoodItem> FoodItems => Set<FoodItem>();
    public DbSet<FoodCheckLog> FoodChecks => Set<FoodCheckLog>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.HasPostgresExtension("postgis");

        void UserFk<T>(Expression<Func<T, object?>> fk) where T : class =>
            b.Entity<T>().HasOne<ApplicationUser>().WithMany().HasForeignKey(fk).OnDelete(DeleteBehavior.Cascade);

        UserFk<RefreshToken>(x => x.UserId);
        UserFk<PetProfile>(x => x.OwnerId);
        UserFk<Reminder>(x => x.UserId);
        UserFk<FoodCheckLog>(x => x.UserId);
        UserFk<Favorite>(x => x.UserId);

        b.Entity<RefreshToken>().HasIndex(t => t.TokenHash).IsUnique();

        b.Entity<Place>(e =>
        {
            e.Property(p => p.Name).HasMaxLength(200);
            e.Property(p => p.Location).HasColumnType("geography (Point, 4326)");
            e.HasIndex(p => p.Location).HasMethod("gist");
            e.HasIndex(p => new { p.Type, p.Status });
            e.HasMany(p => p.WorkingHours).WithOne().HasForeignKey(w => w.PlaceId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<ApplicationUser>().WithMany().HasForeignKey(p => p.OwnerId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<WalkerProfile>(e =>
        {
            e.Property(w => w.ApproxLocation).HasColumnType("geography (Point, 4326)");
            e.Property(w => w.PricePerWalk).HasPrecision(10, 2);
            e.HasIndex(w => w.UserId).IsUnique();
            e.HasOne(w => w.User).WithMany().HasForeignKey(w => w.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<WalkRequest>(e =>
        {
            e.HasOne(r => r.Walker).WithMany().HasForeignKey(r => r.WalkerProfileId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.Owner).WithMany().HasForeignKey(r => r.OwnerId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.Pet).WithMany().HasForeignKey(r => r.PetId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Review>(e =>
        {
            e.HasIndex(r => new { r.UserId, r.TargetType, r.TargetId }).IsUnique();   // one review per user per target
            e.HasIndex(r => new { r.TargetType, r.TargetId });
            e.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Favorite>(e =>
        {
            e.HasKey(f => new { f.UserId, f.PlaceId });
            e.HasOne(f => f.Place).WithMany().HasForeignKey(f => f.PlaceId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Reminder>().HasOne<PetProfile>().WithMany().HasForeignKey(r => r.PetId).OnDelete(DeleteBehavior.SetNull);

        b.Entity<LostFoundPost>(e =>
        {
            e.Property(x => x.Location).HasColumnType("geography (Point, 4326)");
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<FoodItem>().HasIndex(f => new { f.PetType, f.Key }).IsUnique();
    }
}