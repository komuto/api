import request from 'supertest';
import Promise from 'bluebird';
import app from '../../src/app';

class CategoryModel {
  getAll() {
    return new Promise((resolve, reject) => {
      request(app)
        .get('/categories')
        .set('Content-Type', 'application/json')
        .then((res) => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }

  getSubCategories(id) {
    return new Promise((resolve, reject) => {
      request(app)
        .get(`/categories/${id}/sub-categories`)
        .set('Content-Type', 'application/json')
        .then((res) => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }

  getAllSubCategories() {
    return new Promise((resolve, reject) => {
      request(app)
        .get('/categories/sub')
        .set('Content-Type', 'application/json')
        .then((res) => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }

  getBrand(id) {
    return new Promise((resolve, reject) => {
      request(app)
        .get(`/categories/${id}/brands`)
        .set('Content-Type', 'application/json')
        .then((res) => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }
}

export default CategoryModel;
