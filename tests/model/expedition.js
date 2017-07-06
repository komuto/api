import request from 'supertest';
import Promise from 'bluebird';
import app from '../../src/app';

class ExpeditionModel {
  getServices() {
    return new Promise((resolve, reject) => {
      request(app)
        .get('/expeditions/services')
        .set('Content-Type', 'application/json')
        .then(res => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }
  getAll() {
    return new Promise((resolve, reject) => {
      request(app)
        .get('/expeditions/')
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

export default ExpeditionModel;
