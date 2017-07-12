import ExpeditionModel from '../../../model/expedition';

describe('GET /expeditions/{id}/cost', () => {
  it('GET cost with correct parameters should return valid response', async () => {
    const expeditionModel = new ExpeditionModel();
    const expedition_id = 1;
    const params = {
      origin_ro_id : 501,
      destination_ro_id: 62,
      weight: 1700
    };
    const data = await expeditionModel.getCost(expedition_id, params);
    expect(data.code).toBe(200);
    expect(data.status).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'name',
      'full_name',
      'description',
      'cost',
      'etd',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      full_name: expect.any(String),
      description: expect.any(String),
      cost: expect.any(Number),
      etd: expect.any(String)
    }));
  });

  it('GET cost with empty parameters should return invalid response', async () => {
    const expeditionModel = new ExpeditionModel();
    const expedition_id = 1;
    const params = {};
    const data = await expeditionModel.getCost(expedition_id, params);
    expect(data.code).toBe(400);
    expect(data.status).toBe(false);
    expect(data.data.weight).toEqual(expect.arrayContaining(['Weight can\'t be blank']));
    expect(data.data.origin_ro_id).toEqual(expect.arrayContaining(['Origin ro id can\'t be blank']));
    expect(data.data.destination_ro_id).toEqual(expect.arrayContaining(['Destination ro id can\'t be blank']));
  });

  it('GET cost with empty parameters and invalid expedition id should return invalid response', async () => {
    const expeditionModel = new ExpeditionModel();
    const expedition_id = 1000;
    const params = {};
    const data = await expeditionModel.getCost(expedition_id, params);
    expect(data.code).toBe(400);
    expect(data.status).toBe(false);
    expect(data.data.weight).toEqual(expect.arrayContaining(['Weight can\'t be blank']));
    expect(data.data.origin_ro_id).toEqual(expect.arrayContaining(['Origin ro id can\'t be blank']));
    expect(data.data.destination_ro_id).toEqual(expect.arrayContaining(['Destination ro id can\'t be blank']));
  });

  it('GET cost with valid parameters and invalid expedition id should return invalid response', async () => {
    const expeditionModel = new ExpeditionModel();
    const expedition_id = 1000;
    const params = {};
    const data = await expeditionModel.getCost(expedition_id, params);
    expect(data.code).toBe(400);
    expect(data.status).toBe(false);
  });
  it('GET cost with invalid weight parameter should return invalid response', async () => {
    const expeditionModel = new ExpeditionModel();
    const expedition_id = 1000;
    const params = {
      origin_ro_id : 501,
      destination_ro_id: 62,
      weight: 0
    };
    const data = await expeditionModel.getCost(expedition_id, params);
    expect(data.code).toBe(400);
    expect(data.status).toBe(false);
  });
  it('GET cost with invalid weight origin_ro_id should return invalid response', async () => {
    const expeditionModel = new ExpeditionModel();
    const expedition_id = 1000;
    const params = {
      origin_ro_id : 50100,
      destination_ro_id: 62,
      weight: 1000
    };
    const data = await expeditionModel.getCost(expedition_id, params);
    expect(data.code).toBe(400);
    expect(data.status).toBe(false);
  });
  it('GET cost with invalid destination_ro_id parameter should return invalid response', async () => {
    const expeditionModel = new ExpeditionModel();
    const expedition_id = 1000;
    const params = {
      origin_ro_id : 501,
      destination_ro_id: 62000,
      weight: 0
    };
    const data = await expeditionModel.getCost(expedition_id, params);
    expect(data.code).toBe(400);
    expect(data.status).toBe(false);
  });
});
