/* eslint-disable no-undef */
import LocationModel from '../../../model/location';

describe('GET /locations/districts information', () => {
  it('GET all districts should return data', async () => {
    const expeditionModel = new LocationModel();
    const params = {};
    const data = await expeditionModel.getDistricts(params);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(500);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'name',
      'ro_id'
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      ro_id: expect.any(Number),
      name: expect.any(String)
    }));
  });
  it('GET districts with valid province_id should return data', async () => {
    const expeditionModel = new LocationModel();
    const params = {
      province_id: 34
    };
    const data = await expeditionModel.getDistricts(params);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toEqual(5);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'name',
      'ro_id'
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      ro_id: expect.any(Number),
      name: expect.any(String)
    }));
  });

  it('GET districts with invalid province_id should return empty data', async () => {
    const expeditionModel = new LocationModel();
    const params = {
      province_id: 3400
    };
    const data = await expeditionModel.getDistricts(params);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toEqual(0);
  });

  it('GET districts with empty province_id should return empty data', async () => {
    const expeditionModel = new LocationModel();
    const params = {
      province_id: null
    };
    const data = await expeditionModel.getDistricts(params);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(0);
  });
});
