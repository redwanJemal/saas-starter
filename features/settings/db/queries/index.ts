// features/settings/db/queries/index.ts
// Countries
export { getCountries } from './countries/get-countries.query';
export { getCountryById } from './countries/get-country-by-id.query';
export { createCountry } from './countries/create-country.query';
export { updateCountry } from './countries/update-country.query';
export { deleteCountry } from './countries/delete-country.query';

// Currencies
export { getCurrencies } from './currencies/get-currencies.query';
export { getCurrencyById } from './currencies/get-currency-by-id.query';
export { createCurrency } from './currencies/create-currency.query';
export { updateCurrency } from './currencies/update-currency.query';
export { deleteCurrency } from './currencies/delete-currency.query';

// Couriers
export { getCouriers } from './couriers/get-couriers.query';
export { getCourierById } from './couriers/get-courier-by-id.query';
export { createCourier } from './couriers/create-courier.query';
export { updateCourier } from './couriers/update-courier.query';
export { deleteCourier } from './couriers/delete-courier.query';