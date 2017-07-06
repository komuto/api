/* eslint-disable no-undef */
import ExpeditionModel from '../../../model/expedition';

describe('GET expeditions information', () => {
  it('GET all expedition /expeditions should return data', async (done) => {
    const expeditionModel = new ExpeditionModel();
    const data = await expeditionModel.getAll();

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'name',
      'logo',
      'insurance_fee',
      'services',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      logo: expect.any(String),
      insurance_fee: expect.any(Number),
      services: expect.any(Array),
    }));
    expect(Object.keys(data.data[0].services[0])).toEqual(expect.arrayContaining([
      'id',
      'name',
      'logo',
      'description',
      'is_checked',
      'full_name',
    ]));
    expect(data.data[0].services[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      description: expect.any(String),
      full_name: expect.any(String),
    }));
    done();
  });
  it('GET all expedition /expeditions/services should return data', async (done) => {
    const expeditionModel = new ExpeditionModel();
    const data = await expeditionModel.getServices();

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'name',
      'logo',
      'description',
      'is_checked',
      'full_name',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      description: expect.any(String),
      full_name: expect.any(String),
    }));
    done();
  });
});
