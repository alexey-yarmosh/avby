const { Client } = require('pg');
const format = require('pg-format');
const axios = require('axios');
const config = require('./config');

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
    engineVolume: getProperty(advert, 'engine_capacity'),
    engineType: getProperty(advert, 'engine_type'),
    driveType: getProperty(advert, 'drive_type'),
    transmissionType: getProperty(advert, 'transmission_type'),
    mileage: getProperty(advert, 'mileage_km')
  }
}

const getProperty = (advert, fieldName) => {
  try {
    const value = advert.properties.find(({ name }) => name === fieldName).value;
    return translate(fieldName, value);
  } catch (err) {
    if (fieldName === 'mileage_km') { // if mileage is 0, there is no such such item in properties array
      return 0;
    }
    const isElectro = getProperty(advert, 'engine_type') === 'electro'; // electric engines do not have volume property
    if (fieldName === 'engine_capacity' && isElectro) {
      return '';
    }
    if (fieldName === 'drive_type') { // some cars do not have drive info, it can be inserted manually
      return '';
    }
    console.log('advert.publicUrl', advert.publicUrl);
    console.log('advert.properties', advert.properties);
    console.log('fieldName', fieldName);
    throw err;
  }
}

const translate = (fieldName, value) => {
  const translations = config.translations[fieldName];
  if (translations) {
    const translatedValue = translations[value];
    if (!translatedValue) {
      console.log('fieldName', fieldName);
      console.log('value', value);
      throw new Error();
    }
    return translatedValue;
  } else {
    return value;
  }
}

const getItems = async (price, stepSize, page) => {
  let subResult = [];
  const response = await axios.post('https://api.av.by/offer-types/cars/filters/main/apply', {
    "page": page,
    "properties": [
        {
            "name": "price_usd",
            "value": {
                "max": `${price+stepSize}`,
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
    subResult = await getItems(price, stepSize, page + 1);
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
    engineVolume,
    engineType,
    driveType,
    transmissionType,
    publishedAt,
    url
  }) => [id, brand, model, year, price, mileage, bodyType, engineType, engineVolume, driveType, transmissionType, url, publishedAt])
  await client.query(format(`
    INSERT INTO vehicles (id, brand, model, year, price, mileage, body_type, engine_type, engine_volume, drive_type, transmission_type, url, published_at) 
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
      engine_volume = EXCLUDED.engine_volume,
      drive_type = EXCLUDED.drive_type,
      transmission_type = EXCLUDED.transmission_type,
      url = EXCLUDED.url,
      published_at = EXCLUDED.published_at;
  `, values), []);
}

const run = async () => {
  for (let i = 0; i < 20000; i+=100) { // there are a lot of cheap cars so the step is small
    const items = await getItems(i, 100, 1);
    await save(items);
  }

  for (let i = 20000; i < 100000; i+=1000) { // there is less amount of expensive cars so the step is bigger 
    const items = await getItems(i, 1000, 1);
    await save(items);
  }

  for (let i = 100000; i < 990000; i+=10000) { // fetching very expensive cars with big step
    const items = await getItems(i, 10000, 1);
    await save(items);
  }
}

const main = async () => {
  await client.connect();
  await run();
  await client.end();
  console.log('DONE!')
}
main();


