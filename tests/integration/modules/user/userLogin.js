/* eslint-disable no-undef */
import UserModel from '../../../model/user';

describe('POST /users/login/ - user login', () => {
  it('user login any without params', async () => {
    const userModel = new UserModel();
    const data = await userModel.login('', '');
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    expect(typeof data.data).toBe('object');
    expect(data.data.email).toEqual(expect.arrayContaining(['Email harus diisi']));
    expect(data.data.password).toEqual(expect.arrayContaining(['Password harus diisi']));
  });

  it('user login without email', async () => {
    const userModel = new UserModel();
    const data = await userModel.login('', 'andrew');
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    expect(typeof data.data).toBe('object');
    expect(data.data.email).toEqual(expect.arrayContaining(['Email harus diisi']));
  });

  it('user login without password', async () => {
    const userModel = new UserModel();
    const data = await userModel.login('andrew@skyshi.com', '');
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    expect(typeof data.data).toBe('object');
    expect(data.data.password).toEqual(expect.arrayContaining(['Password harus diisi']));
  });

  it('user login with invalid password', async () => {
    const userModel = new UserModel();
    const data = await userModel.login('andrew@skyshi.com', 'asd');
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    expect(typeof data.data).toBe('object');
    // expect(data.message).toEqual('Password salah');
    expect(data.data.password).toEqual(expect.arrayContaining(['Password salah']));
  });

  it('user login with invalid email', async () => {
    const userModel = new UserModel();
    const data = await userModel.login('invalid@skyshi.com', 'asd');
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    expect(typeof data.data).toBe('object');
    // expect(data.message).toEqual('Email belum terdaftar');
    expect(data.data.email).toEqual(expect.arrayContaining(['Email tidak terdaftar']));
  });

  it('user login with correct params', async () => {
    const userModel = new UserModel();
    const data = await userModel.login('andrew@skyshi.com', 'andrew');
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
