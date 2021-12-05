const { Client } = require('pg');
const format = require('pg-format');
const axios = require('axios');

const client = new Client({
  user: 'postgres',
  database: 'postgres',
  password: 'postgres',
});

const getItem = advert => {
  return {
    id: advert.id,
    publishedAt: advert.publishedAt,
    brand: advert.metadata.brandSlug,
    model: advert.metadata.modelSlug,
    year: advert.year,
    url: advert.publicUrl,
    price: advert.price.usd.amount,
    bodyType: getProperty(advert, 'body_type'),
    engineCapacity: getProperty(advert, 'engine_capacity'),
    engineType: getProperty(advert, 'engine_type'),
    transmissionType: getProperty(advert, 'transmission_type'),
    mileage: getProperty(advert, 'mileage_km')
  }
}

const getProperty = (advert, fieldName) => {
  try {
    return advert.properties.find(({ name }) => name === fieldName).value;
  } catch (err) {
    if (fieldName === 'mileage_km') {
      return 0;
    }
    const isElectro = getProperty(advert, 'engine_type') === 'электро';
    if (isElectro) {
      return '';
    }
    console.log('advert.publicUrl', advert.publicUrl)
    console.log('advert.properties', advert.properties);
    console.log('fieldName', fieldName);
    throw err;
  }
}

const getItems = async (price, page) => {
  let subResult = [];
  const response = await axios.post('https://api.av.by/offer-types/cars/filters/main/apply', {
    "page": page,
    "properties": [
        {
            "name": "price_usd",
            "value": {
                "max": `${price+10000}`,
                "min": `${price}`
            }
        },
        {
            "name": "price_currency",
            "value": 2
        }
    ],
    "sorting": 5
  });
  console.log('price', price, 'count', response.data.count, 'page', page)
  const adverts = response.data.adverts.map(getItem);

  if (adverts.length) {
    subResult = await getItems(price, page + 1);
  }
  return [...adverts, ...subResult];
}

const save = async (items) => {
  if (!items.length) {
    return;
  }
  const values = items.map(({
    id,
    brand,
    model,
    year,
    price,
    bodyType,
    mileage,
    engineCapacity,
    engineType,
    transmissionType,
    publishedAt,
    url
  }) => [id, brand, model, year, price, mileage, bodyType, engineType, engineCapacity, transmissionType, url, publishedAt])
  await client.query(format(`
    INSERT INTO vehicles (id, brand, model, year, price, mileage, body_type, engine_type, engine_capacity, transmission_type, url, published_at) 
    VALUES %L 
    ON CONFLICT (id) DO UPDATE 
    SET
      id = EXCLUDED.id, 
      brand = EXCLUDED.brand,
      model = EXCLUDED.model,
      year = EXCLUDED.year,
      price = EXCLUDED.price,
      mileage = EXCLUDED.mileage,
      body_type = EXCLUDED.body_type,
      engine_type = EXCLUDED.engine_type,
      engine_capacity = EXCLUDED.engine_capacity,
      transmission_type = EXCLUDED.transmission_type,
      url = EXCLUDED.url,
      published_at = EXCLUDED.published_at;
  `, values), []);
}

const run = async () => {
  for (let i = 110000; i < 10000000; i+=10000) {
    const items = await getItems(i, 1);
    await save(items);
  }
}

const main = async () => {
  await client.connect();
  await run();
  await client.end();
}
main();


