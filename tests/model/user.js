import request from 'supertest';
import Promise from 'bluebird';
import app from '../../src/app';

class UserModel {
  constructor(token = null) {
    this.token = token;
  }

  static setToken(token) {
    this.token = token;
  }

  login(email, password) {
    return new Promise((resolve, reject) => {
      request(app)
        .post('/users/login')
        .send({
          email,
          password
        })
        .set('Content-Type', 'application/json')
        .expect(200)
        .then(res => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });;
    });
  }
}

export default UserModel;
