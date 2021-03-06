/* eslint-disable no-undef */
import request from 'supertest';
import app from '../../../../src/app';
import AddressModel from '../../../model/address';
import UserModel from '../../../model/user';

describe('PUT /users/addresses/{id} : update address', () => {
  var testData = {};
  beforeAll(async (done) => {
    const userModel = new UserModel();
    const user = await userModel.login('andrew@skyshi.com', 'andrew');

    testData.token = user.data.token;
    const addressModel = new AddressModel(testData.token);

    const addresses = await addressModel.getAll();
    if (addresses.data) {
      testData.address = addresses.data[0];
    } else {
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

  it('Update address should work', async () => {
    const addressModel = new AddressModel(testData.token);
    const id = testData.address.id;
    const data = await addressModel.update(id, {
      "village_id": 3404050003,
      "is_primary": true
    });
    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
  });

  it('Update address shouldn\'t work for invalid id', async () => {
    const addressModel = new AddressModel(testData.token);
    const data = await addressModel.update(1212121, {
      "village_id": 3404050003,
      "is_primary": true
    });
    expect(data.status).toBe(false);
    expect(data.code).toBe(406);
  });
});
