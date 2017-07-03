/* eslint-disable no-undef */
import BankModel from '../../../model/bank';

describe('GET banks information', () => {
  it('GET single bank /banks/{id} should work', async () => {
    const bankModel = new BankModel();
    const data = await bankModel.get(1);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(Object.keys(data.data)).toEqual(expect.arrayContaining([
      'id',
      'name',
      'code',
      'status',
      'status_at',
      'logo',
    ]));
    expect(data.data).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      code: expect.any(String),
      status: expect.any(Number),
      status_at: expect.any(Number),
      logo: expect.any(String),
    }));
  });

  it('GET all address /addresses should return data', async () => {
    const bankModel = new BankModel();
    const data = await bankModel.getAll();

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'name',
      'code',
      'status',
      'status_at',
      'logo',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      code: expect.any(String),
      status: expect.any(Number),
      status_at: expect.any(Number),
      logo: expect.any(String),
    }));
  });
});
