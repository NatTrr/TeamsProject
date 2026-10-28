using Microsoft.EntityFrameworkCore;
using PetApp.Api.Common;
using PetApp.Api.Domain;
using PetApp.Api.Dtos;

namespace PetApp.Api.Data;

public static class Seeder
{
    public static async Task SeedAsync(AppDbContext db, bool demoData)
    {
        if (!await db.FoodItems.AnyAsync())
        {
            db.FoodItems.AddRange(FoodSeed());
            await db.SaveChangesAsync();
        }

        if (demoData && !await db.Places.AnyAsync())
        {
            // Clearly fake demo pins around Skopje centre so the map isn't empty. Replace with real data.
            db.Places.AddRange(
                PlaceMapper.Create(new PlaceInput(PlaceType.Shop, "DEMO Pet Shop", "Demo data", "Demo street 1", "Skopje",
                    "https://example.com", null, 41.9965, 21.4314, false, null,
                    Enum.GetValues<DayOfWeek>().Select(d => new WorkingHourDto(d, new TimeOnly(9, 0), new TimeOnly(20, 0))).ToList()), null),
                PlaceMapper.Create(new PlaceInput(PlaceType.DogPark, "DEMO Dog Park", "Demo data", null, "Skopje",
                    null, null, 41.9900, 21.4400, true, null, null), null),
                PlaceMapper.Create(new PlaceInput(PlaceType.Vet, "DEMO Vet Clinic", "Demo data", null, "Skopje",
                    null, null, 42.0010, 21.4200, false, null,
                    Enum.GetValues<DayOfWeek>().Select(d => new WorkingHourDto(d, new TimeOnly(8, 0), new TimeOnly(18, 0))).ToList()), null),
                PlaceMapper.Create(new PlaceInput(PlaceType.EmergencyVet, "DEMO 24/7 Emergency Vet", "Demo data", null, "Skopje",
                    null, null, 41.9800, 21.4600, true, null, null), null));
            await db.SaveChangesAsync();
        }
    }

    static FoodItem F(PetType pet, string key, string en, string mk, Verdict v, string explEn, string explMk, string aliases) => new()
    {
        PetType = pet, Key = key, NameEn = en, NameMk = mk, Verdict = v,
        ExplanationEn = explEn, ExplanationMk = explMk, Aliases = aliases
    };

    static List<FoodItem> FoodSeed()
    {
        var items = new List<FoodItem>();

        // Same for all four animals
        foreach (var pet in Enum.GetValues<PetType>())
        {
            items.Add(F(pet, "chocolate", "Chocolate", "Чоколадо", Verdict.Toxic,
                "Chocolate is toxic to dogs, cats, birds and small rodents. Dark chocolate and cocoa are the most dangerous. If your pet ate some, call a vet.",
                "Чоколадото е токсично за кучиња, мачки, птици и мали глодачи. Темното чоколадо и какаото се најопасни. Ако вашиот миленик јадел, јавете се кај ветеринар.",
                "chocolate,cocoa,чоколадо,чоколада,какао"));
            items.Add(F(pet, "onion-garlic", "Onion and garlic", "Кромид и лук", Verdict.Toxic,
                "Onions, garlic, leeks and chives can damage red blood cells in pets and are toxic.",
                "Кромидот, лукот, празот и власецот можат да ги оштетат црвените крвни зрнца кај милениците и се токсични.",
                "onion,onions,garlic,leek,leeks,chives,кромид,кромидот,лук,лукот,праз,власец"));
        }

        // Dog
        items.Add(F(PetType.Dog, "grapes", "Grapes and raisins", "Грозје и суво грозје", Verdict.Toxic,
            "Grapes and raisins can cause kidney failure in dogs, even in small amounts. Call a vet right away if your dog ate some.",
            "Грозјето и сувото грозје можат да предизвикаат откажување на бубрезите кај кучињата, дури и во мали количини. Веднаш јавете се кај ветеринар.",
            "grape,grapes,raisin,raisins,sultana,sultanas,грозје,грозд,суво грозје,суво грозд"));
        items.Add(F(PetType.Dog, "xylitol", "Xylitol (sweetener)", "Ксилитол (подсладувач)", Verdict.Toxic,
            "Xylitol, found in sugar-free gum, candy and some peanut butters, is highly toxic to dogs. Go to a vet immediately.",
            "Ксилитолот, кој се наоѓа во жвакалки и бонбони без шеќер, е многу токсичен за кучињата. Веднаш отидете кај ветеринар.",
            "xylitol,sugar free gum,ксилитол"));
        items.Add(F(PetType.Dog, "macadamia", "Macadamia nuts", "Макадамија", Verdict.Toxic,
            "Macadamia nuts can cause weakness, vomiting and tremors in dogs.",
            "Макадамијата може да предизвика слабост, повраќање и тремор кај кучињата.",
            "macadamia,macadamia nuts,макадамија"));
        items.Add(F(PetType.Dog, "avocado", "Avocado", "Авокадо", Verdict.Caution,
            "Avocado flesh is only mildly risky for dogs, but the pit is a choking hazard and the fat can upset the stomach. Best avoided.",
            "Месото од авокадо е малку ризично за кучињата, но коскичката може да задави, а мастите можат да го вознемират стомакот. Подобро избегнувајте.",
            "avocado,авокадо"));
        items.Add(F(PetType.Dog, "cooked-bones", "Cooked bones", "Варени коски", Verdict.Caution,
            "Cooked bones can splinter and injure a dog's mouth or intestines.",
            "Варените коски можат да се скршат и да ја повредат устата или цревата на кучето.",
            "bone,bones,cooked bones,коска,коски,кокал,кокалче"));
        items.Add(F(PetType.Dog, "chicken", "Cooked chicken", "Варено пилешко", Verdict.Safe,
            "Plain cooked chicken without bones, seasoning, onion or garlic is generally fine for dogs in moderation.",
            "Обичното варено пилешко без коски, зачини, кромид и лук е генерално во ред за кучињата во умерени количини.",
            "chicken,cooked chicken,пилешко,пилешко месо"));

        // Cat
        items.Add(F(PetType.Cat, "grapes", "Grapes and raisins", "Грозје и суво грозје", Verdict.Caution,
            "Grapes and raisins are toxic to dogs and are best avoided for cats too.",
            "Грозјето и сувото грозје се токсични за кучињата, а подобро е да се избегнуваат и кај мачките.",
            "grape,grapes,raisin,raisins,грозје,грозд,суво грозје"));
        items.Add(F(PetType.Cat, "tuna", "Tuna", "Туна", Verdict.Caution,
            "Tuna is fine as an occasional treat, but it is not a complete diet and too much can cause nutrition problems.",
            "Туната е во ред како повремена награда, но не е целосна исхрана, а премногу може да предизвика проблеми.",
            "tuna,туна"));
        items.Add(F(PetType.Cat, "milk", "Cow's milk", "Кравјо млеко", Verdict.Caution,
            "Many adult cats are lactose intolerant, so cow's milk can cause diarrhoea.",
            "Многу возрасни мачки не поднесуваат лактоза, па кравјото млеко може да предизвика дијареја.",
            "milk,cow milk,cows milk,млеко,кравјо млеко"));
        items.Add(F(PetType.Cat, "chicken", "Cooked chicken", "Варено пилешко", Verdict.Safe,
            "Plain cooked chicken without bones or seasoning is generally fine for cats in moderation.",
            "Обичното варено пилешко без коски и зачини е генерално во ред за мачките во умерени количини.",
            "chicken,cooked chicken,пилешко,пилешко месо"));

        // Parrot
        items.Add(F(PetType.Parrot, "avocado", "Avocado", "Авокадо", Verdict.Toxic,
            "Avocado is toxic to birds and can be fatal. Never feed it to a parrot.",
            "Авокадото е токсично за птиците и може да биде смртоносно. Никогаш не му го давајте на папагал.",
            "avocado,авокадо,guacamole,гвакамоле"));
        items.Add(F(PetType.Parrot, "caffeine", "Coffee, tea and energy drinks", "Кафе, чај и енергетски пијалоци", Verdict.Toxic,
            "Caffeine is toxic to birds and can cause heart problems.",
            "Кофеинот е токсичен за птиците и може да предизвика проблеми со срцето.",
            "coffee,tea,caffeine,energy drink,energy drinks,кафе,чај,кофеин,енергетски пијалок"));

        // Hamster
        items.Add(F(PetType.Hamster, "citrus", "Citrus fruit", "Citrus", Verdict.Caution,
            "Citrus is acidic and can cause mouth sores and stomach upset in hamsters. Best avoided.",
            "Цитрусите се кисели и можат да предизвикаат рани во устата и стомачни проблеми кај хрчаците. Подобро избегнувајте.",
            "orange,lemon,citrus,grapefruit,tangerine,портокал,лимон,цитрус,грејпфрут,мандарина"));
        items.Add(F(PetType.Hamster, "almond", "Almonds", "Бадем", Verdict.Caution,
            "Sweet almonds are only OK in tiny amounts; bitter almonds are toxic. Safer to skip them.",
            "Слатките бадеми се во ред само во мали количини, а горчливите се токсични. Побезбедно е да ги избегнувате.",
            "almond,almonds,бадем,бадеми"));
        items.Add(F(PetType.Hamster, "cucumber", "Cucumber", "Краставица", Verdict.Safe,
            "Washed cucumber is fine in small amounts. Too much can cause loose stools.",
            "Измиената краставица е во ред во мали количини. Премногу може да предизвика мека столица.",
            "cucumber,краставица"));

        // Apple and carrot for dog, parrot, hamster
        foreach (var pet in new[] { PetType.Dog, PetType.Parrot, PetType.Hamster })
        {
            items.Add(F(pet, "apple", "Apple", "Јаболко", Verdict.Safe,
                "Apple flesh is fine in small amounts. Remove the seeds and core, and wash it well.",
                "Месото од јаболко е во ред во мали количини. Отстранете ги семките и јадрото и измијте го добро.",
                "apple,apples,јаболко,јаболка"));
            items.Add(F(pet, "carrot", "Carrot", "Морков", Verdict.Safe,
                "Washed carrot is fine in small amounts.",
                "Измиениот морков е во ред во мали количини.",
                "carrot,carrots,морков,моркови"));
        }

        return items;
    }
}