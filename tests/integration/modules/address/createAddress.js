/* eslint-disable no-undef */
import AddressModel from '../../../model/address';
import UserModel from '../../../model/user';

describe('POST /users/address', () => {
  var testData = {};
  beforeAll(async () => {
    const userModel = new UserModel();
    const user = await userModel.login('andrew@skyshi.com', 'andrew');

    testData.token = user.data.token;
    const addressModel = new AddressModel(testData.token);

    const address = await addressModel.getPrimary();
    if (address.data) {
      testData.address = address.data;
      if (typeof address.id !== undefined) {
        await addressModel.del(testData.address.id);
      }
    }
  });

  it('create address with empty parameter', async () => {
    const addressModel = new AddressModel(testData.token);
    const data = await addressModel.create({});
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
  });

  it('create address with correct parameter', async () => {
    const addressModel = new AddressModel(testData.token);
    const data = await addressModel.create({
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
    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(Object.keys(data.data)).toEqual(expect.arrayContaining([
      'id',
      'name',
      'email',
      'phone_number',
      'postal_code',
      'address',
      'alias_address',
      'is_primary_address',
      'is_sale_address',
      'is_tender_address',
      'province',
      'district',
      'subDistrict',
      'village',
    ]));

  });
  it('create address again should be rejected', async () => {
    const addressModel = new AddressModel(testData.token);
    const data = await addressModel.create({
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
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
  });
});


