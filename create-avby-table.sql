DROP TABLE vehicles;

CREATE TABLE vehicles (
    id int PRIMARY KEY,
    brand varchar(255) NOT NULL,
    model varchar(255) NOT NULL,
    year int NOT NULL,
    price int NOT NULL,
    mileage int NOT NULL,
    body_type varchar(255) NOT NULL,
    engine_type varchar(255) NOT NULL,
    engine_volume varchar(255) NOT NULL,
    drive_type varchar(255) NOT NULL,
    transmission_type varchar(255) NOT NULL,
    url varchar(255) NOT NULL,
    published_at varchar(255) NOT NULL
);

-- EXPORT
SELECT
    brand,
    model,
    year,
    price,
    mileage,
    body_type,
    engine_type,
    engine_volume,
    drive_type,
    transmission_type,
    url,
    published_at
FROM vehicles;

