/* eslint-disable no-undef */
import request from 'supertest';
import app from '../../../../src/app';

describe('POST /passwords/forgot', () => {

  it('user make request with invalid email', () => {
    return request(app)
      .post('/passwords/forgot')
      .send({
        email: "andrewtester@skyshi.com"
      })
      .set('Content-Type', 'application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(false);
        expect(res.body.code).toBe(400);
        expect(res.body.message).toEqual('Email belum terdaftar');
        // expect(res.body.data.email).toEqual(expect.arrayContaining(['Email belum terdaftar']));
      });
  });

  it('user make request with valid email', () => {
    return request(app)
      .post('/passwords/forgot')
      .send({
        email: "andrew@skyshi.com"
      })
      .set('Content-Type', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(true);
        expect(res.body.code).toBe(200);
      });
  });
});
