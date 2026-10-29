using System.Net.Mail;
using System.Security.Claims;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using PetApp.Api.Dtos;

namespace PetApp.Api.Common;

public static class Err
{
    public static IResult Bad(string code, string? detail = null) => Results.BadRequest(new ApiError(code, detail));
    public static IResult NotFound(string code) => Results.NotFound(new ApiError(code));
    public static IResult Conflict(string code) => Results.Conflict(new ApiError(code));
    public static IResult Unauthorized(string code) => Results.Json(new ApiError(code), statusCode: 401);
    public static IResult Forbidden(string code) => Results.Json(new ApiError(code), statusCode: 403);
}

public static class UserExtensions
{
    public static Guid Id(this ClaimsPrincipal u) => Guid.Parse(u.FindFirst("sub")!.Value);
}

public static class Lang
{

    public static string From(HttpRequest r) =>
        r.Headers.AcceptLanguage.ToString().TrimStart().StartsWith("mk", StringComparison.OrdinalIgnoreCase) ? "mk" : "en";
}

public static class Check
{
    public static bool IsEmail(string? email) =>
        !string.IsNullOrWhiteSpace(email) && MailAddress.TryCreate(email.Trim(), out var a) && a.Address == email.Trim();
}

public static class Geo
{
    static readonly GeometryFactory Factory = NtsGeometryServices.Instance.CreateGeometryFactory(4326);

    public static Point ToPoint(double lat, double lng) => Factory.CreatePoint(new Coordinate(lng, lat));
    public static bool Valid(double lat, double lng) => lat is >= -90 and <= 90 && lng is >= -180 and <= 180;

    public static double DistanceKm(double lat1, double lng1, double lat2, double lng2)
    {
        static double Rad(double d) => d * Math.PI / 180;
        var dLat = Rad(lat2 - lat1);
        var dLng = Rad(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(Rad(lat1)) * Math.Cos(Rad(lat2)) * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return 6371 * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}