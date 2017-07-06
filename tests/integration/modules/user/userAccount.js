/* eslint-disable no-undef */
import UserModel from '../../../model/user';

describe('User Account API', () => {
  it('POST /accounts/email/check with available email', async () => {
    const userModel = new UserModel();
    const data = await userModel.emailCheck('andrewtester@skyshi.com');
    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
    // expect(data.message).toEqual('Email Available');
  });

  it('POST /accounts/email/check with unavailable email', async () => {
    const userModel = new UserModel();
    const data = await userModel.emailCheck('andrew@skyshi.com');
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    // expect(data.message).toEqual('Email sudah terdaftar');
  });
});
