import request from 'supertest';
import Promise from 'bluebird';
import app from '../../src/app';

class BankModel {
  get(id) {
    return new Promise((resolve, reject) => {
      request(app)
        .get('/banks/'+ id)
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
        .get('/banks/')
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

export default BankModel;
