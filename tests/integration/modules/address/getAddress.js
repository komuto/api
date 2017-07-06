/* eslint-disable no-undef */
import request from 'supertest';
import app from '../../../../src/app';
import AddressModel from '../../../model/address';
import UserModel from '../../../model/user';

describe('GET users address', () => {
  var testData = {};
  beforeAll(async (done) => {
    const userModel = new UserModel();
    const user = await userModel.login('andrew@skyshi.com', 'andrew');

    testData.token = user.data.token;
    const addressModel = new AddressModel(testData.token);

    const address = await addressModel.getPrimary();
    testData.address = address.data;
    if (!testData.address) {
      await addressModel.create({
        "province_id": 34,
        "district_id": 3404,
        "sub_district_id": 3404050,
        "village_id": 3404050005,
        "name": "User skyshi",
        "email": "user@skyshi.com",
        "phone_number": "081222333444",
        "postal_code": "84314",
        "address": "Jl. Klamat No. 24 RT. 002 RW. 003",
        "alias_address": "Alamat Toko",
        "is_primary": true
      });
    }
    return done();
  });

  it('GET primary address /users/address should work', async () => {
    const addressModel = new AddressModel(testData.token);
    const data = await addressModel.getPrimary();
    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
  });

  it('GET primary address /users/address shouldn\'t work after deletion', async () => {
    const addressModel = new AddressModel(testData.token);
    const primaryAddressData = await addressModel.getPrimary();
    const id = primaryAddressData.data.id;
    await addressModel.del(id);

    const data = await addressModel.getPrimary();
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
  });

  it('GET single address /users/address shouldn\'t work after deletion', async () => {
    const addressModel = new AddressModel(testData.token);
    const data = await addressModel.get(testData.address.id);

    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
  });

  it('GET all address /users/addresses should return empty data', async () => {
    const addressModel = new AddressModel(testData.token);
    const data = await addressModel.getAll();

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data).toHaveLength(0);
  });

  it('GET all address /users/addresses should return empty data', async () => {
    const addressModel = new AddressModel(testData.token);
    const data = await addressModel.getAll();

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data).toHaveLength(0);
  });

  it('GET single address /users/address should work', async () => {
    const addressModel = new AddressModel(testData.token);
    const addressCreatedData = await addressModel.create({
      "province_id": 34,
      "district_id": 3404,
      "sub_district_id": 3404050,
      "village_id": 3404050005,
      "name": "User skyshi",
      "email": "user@skyshi.com",
      "phone_number": "081222333444",
      "postal_code": "84314",
      "address": "Jl. Klamat No. 24 RT. 002 RW. 003",
      "alias_address": "Alamat Toko",
      "is_primary": true
    });
    const addressPrimaryData = await addressModel.getPrimary();
    const id = addressPrimaryData.data.id;
    const data = await addressModel.get(id);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
  });

  it('GET all address /users/addresses should return data', async () => {
    const addressModel = new AddressModel(testData.token);
    const data = await addressModel.getAll();

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
  });
});
