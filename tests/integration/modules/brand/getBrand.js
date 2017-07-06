/* eslint-disable no-undef */
import BrandModel from '../../../model/brand';

describe('GET Brands information', () => {
  it('GET all brand /brands should return data', async () => {
    const brandModel = new BrandModel();
    const data = await brandModel.getAll();

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'category_id',
      'name',
      'is_checked',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      is_checked: expect.any(String),
      category_id: expect.any(Number),
    }));
  });
});
