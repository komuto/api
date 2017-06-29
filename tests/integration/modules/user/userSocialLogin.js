/* eslint-disable no-undef */
import request from 'supertest';
import app from '../../../../src/app';

describe('POST /users/login/ - user login', () => {
  it('user social login any without any params', () => {
    return request(app)
      .post('/users/social-login')
      .send({})
      .set('Content-Type', 'application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(false);
        expect(res.body.code).toBe(400);
        expect(typeof res.body.data).toBe('object');
        expect(res.body.data.message).toEqual('Provider name can\'t be blank');
        expect(res.body.data.message).toEqual('Provider uid can\'t be blank');
        expect(res.body.data.message).toEqual('Access token can\'t be blank');
        expect(res.body.data.provider_name).toEqual(expect.arrayContaining(['Provider name can\'t be blank']));
        expect(res.body.data.provider_uid).toEqual(expect.arrayContaining(['Provider uid can\'t be blank']));
        expect(res.body.data.access_token).toEqual(expect.arrayContaining(['Access token can\'t be blank']));
      });
  });

  it('user social login without provider_name', () => {
    return request(app)
      .post('/users/social-login')
      .send({
        provider_uid: "1544425745587692",
        access_token: "EAAViKAqZCMswBAEq2e1wH6wQZBhSpyxZBYpLSMuSnEZB6OjEI0YgHlz3B3ZBy6ChWNDoHYPZC1eFGmywzKZA21TrxTmhk5bVHiN7fVxvwZCZAeFZAsgNdvRVPPHERKmrioUEpATKmaDHevzN0eTwa7UMN0xPWCVlvOGCg2yJPAHEEfIxTmNFIG8WS7KLPcwtYZAXUoZD"
      })
      .set('Content-Type', 'application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(false);
        expect(res.body.code).toBe(400);
        expect(typeof res.body.data).toBe('object');
        expect(res.body.data.message).toEqual('Provider name can\'t be blank');
        expect(res.body.data.provider_uid).toEqual(expect.arrayContaining(['Provider name can\'t be blank']));
      });
  });

  it('user social login without access_token', () => {
    return request(app)
      .post('/users/social-login')
      .send({
        provider_name: "faceb",
        provider_uid: "1544425745587692",
      })
      .set('Content-Type', 'application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(false);
        expect(res.body.code).toBe(400);
        expect(typeof res.body.data).toBe('object');
        expect(res.body.data.message).toEqual('Access token can\'t be blank');
        expect(res.body.data.access_token).toEqual(expect.arrayContaining(['Access token can\'t be blank']));
      });
  });

  it('user social login without provider_uid', () => {
    return request(app)
      .post('/users/social-login')
      .send({
        provider_name: "faceb",
        access_token: "EAAViKAqZCMswBAEq2e1wH6wQZBhSpyxZBYpLSMuSnEZB6OjEI0YgHlz3B3ZBy6ChWNDoHYPZC1eFGmywzKZA21TrxTmhk5bVHiN7fVxvwZCZAeFZAsgNdvRVPPHERKmrioUEpATKmaDHevzN0eTwa7UMN0xPWCVlvOGCg2yJPAHEEfIxTmNFIG8WS7KLPcwtYZAXUoZD"
      })
      .set('Content-Type', 'application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(false);
        expect(res.body.code).toBe(400);
        expect(typeof res.body.data).toBe('object');
        expect(res.body.data.message).toEqual('Provider uid can\'t be blank');
        expect(res.body.data.provider_name).toEqual(expect.arrayContaining(['Provider uid can\'t be blank']));
      });
  });

  it('user social login with invalid provider_name', () => {
    return request(app)
      .post('/users/social-login')
      .send({
        provider_name: "faceb",
        provider_uid: "1544425745587692",
        access_token: "EAAViKAqZCMswBAEq2e1wH6wQZBhSpyxZBYpLSMuSnEZB6OjEI0YgHlz3B3ZBy6ChWNDoHYPZC1eFGmywzKZA21TrxTmhk5bVHiN7fVxvwZCZAeFZAsgNdvRVPPHERKmrioUEpATKmaDHevzN0eTwa7UMN0xPWCVlvOGCg2yJPAHEEfIxTmNFIG8WS7KLPcwtYZAXUoZD"
      })
      .set('Content-Type', 'application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .then((res) => {
        expect(res.body.status).toBe(false);
        expect(res.body.code).toBe(400);
        expect(typeof res.body.data).toBe('object');
        expect(res.body.data.message).toEqual('Invalid provider name value');
        expect(res.body.data.provider_name).toEqual(expect.arrayContaining(['Invalid provider name value']));
      });
  });

  it('user social login with correct params', () => {
    return request(app)
      .post('/users/social-login')
      .send({
        provider_name: "facebook",
        provider_uid: "1544425745587692",
        access_token: "EAAViKAqZCMswBAEq2e1wH6wQZBhSpyxZBYpLSMuSnEZB6OjEI0YgHlz3B3ZBy6ChWNDoHYPZC1eFGmywzKZA21TrxTmhk5bVHiN7fVxvwZCZAeFZAsgNdvRVPPHERKmrioUEpATKmaDHevzN0eTwa7UMN0xPWCVlvOGCg2yJPAHEEfIxTmNFIG8WS7KLPcwtYZAXUoZD"
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
