/* eslint-disable no-undef */
import request from 'supertest';
import rp from 'request-promise';
var Promise = require('bluebird');
Promise.promisifyAll(request);

import app from '../../../../src/app';

function loginUser(auth) {
  return function(done) {
    request(app)
      .post('/users/login')
      .send({
        email: "andrew@skyshi.com",
        password: "andrew"
      })
      .expect(200)
      .then(res => {
        auth.token = res.body.data.token;
        return done();
      });
      /*.end(onResponse);

    function onResponse(err, res) {
      auth.token = res.body.data.token;
      return done();
    }*/
  };
}

describe('POST user update', () => {
  var auth = {};
  beforeAll(loginUser(auth));

  afterAll((done) => {
    return request(app)
      .put('/users/password')
      .send({
        email: "andrew@skyshi.com",
        password: "andrew",
        old_password: "andrew123"
      })
      .set('Content-Type', 'application/json')
      .then(res => {
        done();
      });
  });

  it('POST users/password update password with invalid old password', () => {
    return request(app)
      .put('/users/password')
      .send({
        email: "andrew@skyshi.com",
        password: "andrew",
        old_password: "andrewtest"
      })
      .set('Authorization', 'JWT ' + auth.token)
      .set('Content-Type', 'application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(false);
        expect(res.body.code).toBe(400);
        expect(typeof res.body.data).toBe('object');
        expect(res.body.message).toEqual('Password salah');
        expect(res.body.data.password).toEqual(expect.arrayContaining(['Password salah']));
      });
  });

  it('POST users/password update password with valid old password', () => {
    return request(app)
      .put('/users/password')
      .send({
        email: "andrew@skyshi.com",
        password: "andrew123",
        old_password: "andrew"
      })
      .set('Authorization', 'JWT ' + auth.token)
      .set('Content-Type', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(true);
        expect(res.body.code).toBe(200);
      });
  });
});
