namespace PetApp.Api.Domain;

public enum PetType { Dog = 1, Cat = 2, Parrot = 3, Hamster = 4 }
public enum PlaceType { Shop = 1, DogPark = 2, Vet = 3, EmergencyVet = 4 }
public enum PlaceStatus { Pending = 0, Approved = 1, Rejected = 2 }    
public enum Verdict { Safe = 1, Caution = 2, Toxic = 3, Unknown = 4 }
public enum AnswerSource { Database = 1, AI = 2, None = 3 }
public enum RequestStatus { Pending = 0, Accepted = 1, Declined = 2 }
public enum ReviewTargetType { Place = 1, Walker = 2 }
public enum RepeatInterval { None = 0, Daily = 1, Weekly = 2, Monthly = 3, Yearly = 4 }
public enum LostFoundType { Lost = 1, Found = 2 }
public enum PetFeature { Shops, DogParks, Vets, Walkers, FoodCheck }

public static class Roles
{
    public const string Owner = "Owner";
    public const string ShopOwner = "ShopOwner";
}