/* eslint-disable no-undef */
import CategoryModel from '../../../model/category';

describe('GET product categories', () => {
  it('GET all categories /categories should return data', async () => {
    const categoryModel = new CategoryModel();
    const data = await categoryModel.getAll();

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'parent_id',
      'name',
      'icon',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      parent_id: expect.any(Number),
      name: expect.any(String),
      icon: expect.any(String),
    }));
  });

  it('GET all categories with sub-categories /categories/sub should work', async () => {
    const categoryModel = new CategoryModel();
    const data = await categoryModel.getAllSubCategories();

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'parent_id',
      'name',
      'icon',
      'sub_categories',
    ]));
    expect(Object.keys(data.data[0].sub_categories[0])).toEqual(expect.arrayContaining([
      'id',
      'parent_id',
      'name',
      'icon',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      parent_id: expect.any(Number),
      name: expect.any(String),
      icon: expect.any(String),
      sub_categories: expect.any(Array)
    }));
    expect(data.data[0].sub_categories[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      parent_id: expect.any(Number),
      name: expect.any(String),
      icon: expect.any(String),
    }));
  });

  it('GET all sub-categories /categories/sub-categories should work', async () => {
    const categoryModel = new CategoryModel();
    const data = await categoryModel.getSubCategories(6);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'parent_id',
      'name',
      'icon',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      parent_id: expect.any(Number),
      name: expect.any(String),
      icon: expect.any(String),
    }));
  });

  it('GET brand by category /categories/{id}/brands should not work for invalid id', async () => {
    const categoryModel = new CategoryModel();
    const data = await categoryModel.getBrand(763);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(Object.keys(data.data[0])).toEqual(expect.arrayContaining([
      'id',
      'category_id',
      'name',
    ]));
    expect(data.data[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      category_id: expect.any(Number),
      name: expect.any(String),
    }));
  });

  it('GET brand by category /categories/{id}/brands should not work for invalid id', async () => {
    const categoryModel = new CategoryModel();
    const data = await categoryModel.getBrand(76300);

    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(data.data.length).toEqual(0);
  });
});
