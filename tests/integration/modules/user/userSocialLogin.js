/* eslint-disable no-undef */
import request from 'supertest';
import app from '../../../../src/app';
import UserModel from '../../../model/user';

describe('POST /users/social-login/ - user login', () => {
  it('user social login any without any params', async () => {
    const userModel = new UserModel();
    const data = await userModel.socialLogin();
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    expect(typeof data.data).toBe('object');
    expect(data.data.message).toEqual('Provider name can\'t be blank');
    expect(data.data.message).toEqual('Provider uid can\'t be blank');
    expect(data.data.message).toEqual('Access token can\'t be blank');
    expect(data.data.provider_name).toEqual(expect.arrayContaining(['Provider name can\'t be blank']));
    expect(data.data.provider_uid).toEqual(expect.arrayContaining(['Provider uid can\'t be blank']));
    expect(data.data.access_token).toEqual(expect.arrayContaining(['Access token can\'t be blank']));
  });

  it('user social login without provider_name', async () => {
    const userModel = new UserModel();
    const data = await userModel.socialLogin('', 1544425745587692, 'EAAViKAqZCMswBAEq2e1wH6wQZBhSpyxZBYpLSMuSnEZB6OjEI0YgHlz3B3ZBy6ChWNDoHYPZC1eFGmywzKZA21TrxTmhk5bVHiN7fVxvwZCZAeFZAsgNdvRVPPHERKmrioUEpATKmaDHevzN0eTwa7UMN0xPWCVlvOGCg2yJPAHEEfIxTmNFIG8WS7KLPcwtYZAXUoZD');
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    expect(typeof data.data).toBe('object');
    expect(data.data.message).toEqual('Provider name can\'t be blank');
    expect(data.data.provider_uid).toEqual(expect.arrayContaining(['Provider name can\'t be blank']));
  });

  it('user social login without access_token', async () => {
    const userModel = new UserModel();
    const data = await userModel.socialLogin('faceb', 1544425745587692);
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    expect(typeof data.data).toBe('object');
    expect(data.data.message).toEqual('Access token can\'t be blank');
    expect(data.data.access_token).toEqual(expect.arrayContaining(['Access token can\'t be blank']));
  });

  it('user social login without provider_uid', async () => {
    const userModel = new UserModel();
    const data = await userModel.socialLogin('faceb', 1544425745587692);
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    expect(typeof data.data).toBe('object');
    expect(data.data.message).toEqual('Provider uid can\'t be blank');
    expect(data.data.provider_name).toEqual(expect.arrayContaining(['Provider uid can\'t be blank']));
  });

  it('user social login with invalid provider_name', async () => {
    const userModel = new UserModel();
    const data = await userModel.socialLogin('faceb', 1544425745587692, "EAAViKAqZCMswBAEq2e1wH6wQZBhSpyxZBYpLSMuSnEZB6OjEI0YgHlz3B3ZBy6ChWNDoHYPZC1eFGmywzKZA21TrxTmhk5bVHiN7fVxvwZCZAeFZAsgNdvRVPPHERKmrioUEpATKmaDHevzN0eTwa7UMN0xPWCVlvOGCg2yJPAHEEfIxTmNFIG8WS7KLPcwtYZAXUoZD");
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    expect(typeof data.data).toBe('object');
    expect(data.data.message).toEqual('Invalid provider name value');
    expect(data.data.provider_name).toEqual(expect.arrayContaining(['Invalid provider name value']));

  });

  it('user social login with correct params', async () => {
    const userModel = new UserModel();
    const data = await userModel.socialLogin('facebook', 1544425745587692, "EAAViKAqZCMswBAEq2e1wH6wQZBhSpyxZBYpLSMuSnEZB6OjEI0YgHlz3B3ZBy6ChWNDoHYPZC1eFGmywzKZA21TrxTmhk5bVHiN7fVxvwZCZAeFZAsgNdvRVPPHERKmrioUEpATKmaDHevzN0eTwa7UMN0xPWCVlvOGCg2yJPAHEEfIxTmNFIG8WS7KLPcwtYZAXUoZD");
    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    expect(typeof data.data).toBe('object');
    expect(Object.keys(data.data)).toEqual(expect.arrayContaining([
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
    expect(data.data).toEqual(expect.objectContaining({
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
