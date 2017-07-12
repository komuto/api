/* eslint-disable no-undef */
import LocationModel from '../../../model/location';

describe('GET /locations/provinces information', () => {
  it('GET all provinces return data', async () => {
    const expeditionModel = new LocationModel();
    const data = await expeditionModel.getProvinces();

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'name'
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String)
    }));
  });
});
