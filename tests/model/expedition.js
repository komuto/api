import request from 'supertest';
import Promise from 'bluebird';
import app from '../../src/app';
import querystring from 'querystring';

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
  getCost(expedition_id, params = {}) {
    return new Promise((resolve, reject) => {
      const path = `/expeditions/${expedition_id}/cost?`+ querystring.stringify(params);
      request(app)
        .get(path)
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
