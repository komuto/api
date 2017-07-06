import request from 'supertest';
import Promise from 'bluebird';
import querystring from 'querystring';
import app from '../../src/app';

class BrandModel {
  getAll(params) {
    return new Promise((resolve, reject) => {
      request(app)
        .get('/brands?'+ querystring.stringify(params))
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

export default BrandModel;
