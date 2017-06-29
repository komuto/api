/* eslint-disable no-undef */
import chalk from 'chalk';
// import moment from 'moment';
import request from 'supertest';
import app from '../../../../src/app';

describe('POST /users/login/ - user login', () => {
  it('user login any without params', () => {
    return request(app)
      .post('/users/login')
      .send({})
      .expect(400)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(typeof res.body.data).toBe('object');
      });
  });
  it('user login with correct params', () => {
    return request(app)
      .post('/users/login')
      .send({
        email: "andrew@skyshi.com",
        password: "andrew"
      })
      .expect(200)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(typeof res.body.data).toBe('object');
        expect(res.body.data).toEqual(expect.objectContaining({
          id: expect.any(Number),
          marketplace_id: expect.any(Number),
          name: expect.any(String),
          email: expect.any(String),
          cooperative_member_number: expect.any(Number),
          approval_cooperative_status: expect.any(Number),
          photo: expect.any(String),
          phone_number: expect.any(String),
          gender: expect.any(String),
          status: expect.any(Number),
          mother_name: expect.any(String),
          auth_key: expect.any(String),
          saldo_wallet: expect.any(Number),
          place_of_birth: expect.any(String),
          date_of_birth: expect.any(String),
          created_at: expect.any(Number),
          join_at: expect.any(Number),
          status_at: expect.any(Number),
          token: expect.any(String),
        }));
      });
  });
});
