/* eslint-disable no-undef */
import request from 'supertest';
import app from '../../../../src/app';
import AddressModel from '../../../model/address';
import UserModel from '../../../model/user';

describe('GET users address', () => {
  var testData = {};
  beforeAll(async () => {
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
  });

  it('Delete primary address /users/addresses/{id} should work', async () => {
    const addressModel = new AddressModel(testData.token);
    const id = testData.address.id;
    const data = await addressModel.del(id);
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
});
