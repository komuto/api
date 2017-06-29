/* eslint-disable no-undef */
import request from 'supertest';
import app from '../../../../src/app';

describe('POST /users/login/ - user login', () => {
  it('user login any without params', () => {
    return request(app)
      .post('/users/login')
      .send({})
      .expect(400)
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(false);
        expect(res.body.code).toBe(400);
        expect(typeof res.body.data).toBe('object');
        expect(res.body.data.email).toEqual(expect.arrayContaining(['Email can\'t be blank']));
        expect(res.body.data.password).toEqual(expect.arrayContaining(['Password can\'t be blank']));
      });
  });

  it('user login without email', () => {
    return request(app)
      .post('/users/login')
      .send({
        password: "andrew",
      })
      .set('Content-Type', 'application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(false);
        expect(res.body.code).toBe(400);
        expect(typeof res.body.data).toBe('object');
        expect(res.body.data.email).toEqual(expect.arrayContaining(['Email can\'t be blank']));
      });
  });

  it('user login without password', () => {
    return request(app)
      .post('/users/login')
      .send({
        email: "andrew@skyshi.com",
      })
      .set('Content-Type', 'application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(false);
        expect(res.body.code).toBe(400);
        expect(typeof res.body.data).toBe('object');
        expect(res.body.data.password).toEqual(expect.arrayContaining(['Password can\'t be blank']));
      });
  });

  it('user login with invalid password', () => {
    return request(app)
      .post('/users/login')
      .send({
        email: "andrew@skyshi.com",
        password: "asd"
      })
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

  it('user login with invalid email', () => {
    return request(app)
      .post('/users/login')
      .send({
        email: "blabla@skyshi.com",
      })
      .set('Content-Type', 'application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(false);
        expect(res.body.code).toBe(400);
        expect(typeof res.body.data).toBe('object');
        expect(res.body.message).toEqual('Email belum terdaftar');
        expect(res.body.data.password).toEqual(expect.arrayContaining(['Email belum terdaftar']));
      });
  });

  it('user login with correct params', () => {
    return request(app)
      .post('/users/login')
      .send({
        email: "andrew@skyshi.com",
        password: "andrew"
      })
      .set('Content-Type', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(true);
        expect(res.body.code).toBe(200);
        expect(typeof res.body.data).toBe('object');
        expect(Object.keys(res.body.data)).toEqual(expect.arrayContaining([
          'id',
          'marketplace_id',
          'name',
          'email',
          'cooperative_member_number',
          'approval_cooperative_status',
          'photo',
          'phone_number',
          'gender',
          'status',
          'mother_name',
          'auth_key',
          'saldo_wallet',
          'place_of_birth',
          'date_of_birth',
          'created_at',
          'join_at',
          'status_at',
          'token'
        ]));
        expect(res.body.data).toEqual(expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          email: expect.any(String),
          approval_cooperative_status: expect.any(Number),
          phone_number: expect.any(String),
          gender: expect.any(String),
          status: expect.any(Number),
          saldo_wallet: expect.any(Number),
          created_at: expect.any(Number),
          status_at: expect.any(Number),
          token: expect.any(String),
        }));
      });
  });
});
