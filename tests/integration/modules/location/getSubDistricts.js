/* eslint-disable no-undef */
import LocationModel from '../../../model/location';

describe('GET /locations/sub-districts information', () => {
  it('GET all sub-districts should return data', async () => {
    const expeditionModel = new LocationModel();
    const params = {};
    const data = await expeditionModel.getSubDistricts(params);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(7000);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'name',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String)
    }));
  });
  it('GET sub-districts with valid district_id should return data', async () => {
    const expeditionModel = new LocationModel();
    const params = {
      district_id: 3404
    };
    const data = await expeditionModel.getSubDistricts(params);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toEqual(17);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'name',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String)
    }));
  });

  it('GET sub-districts with invalid district_id should return empty data', async () => {
    const expeditionModel = new LocationModel();
    const params = {
      district_id: 340400
    };
    const data = await expeditionModel.getSubDistricts(params);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toEqual(0);
  });

  it('GET sub-districts with empty district_id should return empty data', async () => {
    const expeditionModel = new LocationModel();
    const params = {
      district_id: null
    };
    const data = await expeditionModel.getSubDistricts(params);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(0);
  });
});
