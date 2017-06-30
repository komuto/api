/* eslint-disable no-undef */
import request from 'supertest';
import app from '../../../../src/app';

describe('User Account API', () => {
  it('POST /accounts/email/check with available email', () => {
    return request(app)
      .post('/accounts/email/check')
      .send({
        email: "andrewtester@skyshi.com"
      })
      .set('Content-Type', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(true);
        expect(res.body.code).toBe(200);
        expect(res.body.message).toEqual('Email Available');
      });
  });

  it('POST /accounts/email/check with unavailable email', () => {
    return request(app)
      .post('/accounts/email/check')
      .send({
        email: "andrew@skyshi.com"
      })
      .set('Content-Type', 'application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(false);
        expect(res.body.code).toBe(400);
        expect(res.body.message).toEqual('Email sudah terdaftar');
      });
  });
});
