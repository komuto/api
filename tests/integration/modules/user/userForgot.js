/* eslint-disable no-undef */
import UserModel from '../../../model/user';

describe('POST /passwords/forgot', () => {

  it('user make request with invalid email', async () => {
    const userModel = new UserModel();
    const data = await userModel.forgot('andrewtester@skyshi.com');
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    // expect(data.message).toEqual('Email belum terdaftar');
    // expect(data.data.email).toEqual(expect.arrayContaining(['Email belum terdaftar']));
  });

  it('user make request with valid email', async () => {
    const userModel = new UserModel();
    const data = await userModel.forgot('andrew@skyshi.com');
    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
  });
});
