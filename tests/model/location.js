import request from 'supertest';
import Promise from 'bluebird';
import app from '../../src/app';
import querystring from 'querystring';

class LocationModel {
  getProvinces() {
    return new Promise((resolve, reject) => {
      request(app)
        .get('/locations/provinces')
        .set('Content-Type', 'application/json')
        .then(res => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }
  getDistricts(params = {}) {
    return new Promise((resolve, reject) => {
      request(app)
        .get('/locations/districts?'+ querystring.stringify(params))
        .set('Content-Type', 'application/json')
        .then((res) => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }
  getSubDistricts(params = {}) {
    return new Promise((resolve, reject) => {
      request(app)
        .get('/locations/sub-districts?'+ querystring.stringify(params))
        .set('Content-Type', 'application/json')
        .then((res) => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }
  getVillages(params = {}) {
    return new Promise((resolve, reject) => {
      request(app)
        .get('/locations/villages?'+ querystring.stringify(params))
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

export default LocationModel;
