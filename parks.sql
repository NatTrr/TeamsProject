DELETE FROM "Places" WHERE "Name" IN ('Парк шума Гази Баба','Парк за миленици Карпош');

INSERT INTO "Places" ("Id","Type","Status","OwnerId","Name","Description","Address","City","WebsiteUrl","Phone","Location","IsOpen24h","ServesPetTypes","CreatedAt")
SELECT gen_random_uuid(), 3, (SELECT "Status" FROM "Places" LIMIT 1), NULL,
  'Парк шума Гази Баба', 'Голем парк со шума и пешачки патеки, погоден за прошетка со куче.', 'Гази Баба', 'Скопје', NULL, NULL,
  ST_SetSRID(ST_MakePoint(21.454344, 42.008395), 4326)::geography, true, ARRAY[0], now();

INSERT INTO "Places" ("Id","Type","Status","OwnerId","Name","Description","Address","City","WebsiteUrl","Phone","Location","IsOpen24h","ServesPetTypes","CreatedAt")
SELECT gen_random_uuid(), 3, (SELECT "Status" FROM "Places" LIMIT 1), NULL,
  'Парк за миленици Карпош', 'Огради парк за миленици во Карпош, каде кучињата можат слободно да трчаат.', 'Карпош', 'Скопје', NULL, NULL,
  ST_SetSRID(ST_MakePoint(21.40393, 41.99601), 4326)::geography, true, ARRAY[0], now();

SELECT "Name","Type","Status",ST_Y("Location"::geometry) AS lat,ST_X("Location"::geometry) AS lng FROM "Places" ORDER BY "CreatedAt";
