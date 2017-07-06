/* eslint-disable no-undef */
import request from 'supertest';
import UserModel from '../../../model/user';
import rp from 'request-promise';
var Promise = require('bluebird');
Promise.promisifyAll(request);

import app from '../../../../src/app';

describe('POST user update', () => {
  var testData = {};
  beforeAll(async (done) => {
    const userModel = new UserModel();
    const user = await userModel.login('andrew@skyshi.com', 'andrew');
    testData.token = user.data.token;
    return done();
  });

  afterAll(async (done) => {
    const userModel = new UserModel();
    await userModel.updatePassword('andrew@skyshi.com', 'andrew123', 'andrew');
    return done();
  });

  it('POST users/password update password with invalid old password', async () => {
    const userModel = new UserModel(testData.token);
    const data = await userModel.updatePassword('andrew@skyshi.com', 'andrewtest', 'andrew');
    expect(data.status).toBe(false);
    expect(data.code).toBe(400);
    expect(typeof data.data).toBe('object');
    // expect(data.message).toEqual('Password salah');
    expect(data.data.password).toEqual(expect.arrayContaining(['Password salah']));
  });

  it('POST users/password update password with valid old password', async () => {
    const userModel = new UserModel(testData.token);
    const data = await userModel.updatePassword('andrew@skyshi.com', 'andrew', 'andrew123');
    expect(data.status).toBe(true);
    expect(data.code).toBe(200);
  });
});
