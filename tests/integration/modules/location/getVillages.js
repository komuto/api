/* eslint-disable no-undef */
import LocationModel from '../../../model/location';

describe('GET /locations/villages information', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;
  });


  it('GET all villages should return data', async () => {
    const expeditionModel = new LocationModel();
    const params = {};
    const data = await expeditionModel.getVillages(params);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(81000);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'name',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String)
    }));
  });
  it('GET villages with valid sub_district_id should return data', async () => {
    const expeditionModel = new LocationModel();
    const params = {
      sub_district_id: 3404110
    };
    const data = await expeditionModel.getVillages(params);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(5);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'name',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String)
    }));
  });

  it('GET villages with invalid sub_district_id should return empty data', async () => {
    const expeditionModel = new LocationModel();
    const params = {
      sub_district_id: 34040000
    };
    const data = await expeditionModel.getVillages(params);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toEqual(0);
  });

  it('GET villages with empty sub_district_id should return empty data', async () => {
    const expeditionModel = new LocationModel();
    const params = {
      sub_district_id: null
    };
    const data = await expeditionModel.getVillages(params);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(0);
  });
});
