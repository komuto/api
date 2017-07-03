import request from 'supertest';
import Promise from 'bluebird';
import app from '../../src/app';

class AddressModel {
  constructor(token) {
    this.token = token;
  }

  async del(id) {
    const path = '/users/addresses/'+ id;
    return new Promise(resolve => {
      request(app)
        .delete(path)
        .set('Authorization', 'JWT ' + this.token)
        .set('Content-Type', 'application/json')
        .then(res => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }

  async getPrimary() {
    return new Promise(resolve => {
      request(app)
        .get('/users/address')
        .set('Authorization', 'JWT ' + this.token)
        .set('Content-Type', 'application/json')
        .then(res => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    })
  }

  async getAll() {
    return new Promise(resolve => {
      request(app)
        .get('/users/addresses/')
        .set('Authorization', 'JWT ' + this.token)
        .set('Content-Type', 'application/json')
        .expect(200)
        .then(res => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }

  async get(id) {
    return new Promise(resolve => {
      request(app)
        .get('/users/addresses/' + id)
        .set('Authorization', 'JWT ' + this.token)
        .set('Content-Type', 'application/json')
        .then(res => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }

  async create(params) {
    return new Promise(resolve => {
      request(app)
        .post('/users/addresses')
        .send(params)
        .set('Authorization', 'JWT ' + this.token)
        .set('Content-Type', 'application/json')
        .then(res => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err.body);
        });
    });
  }
}

export default AddressModel;
