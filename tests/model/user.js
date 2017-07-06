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
        .then(res => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }
  socialLogin(provider_name = '', provider_uid = '', access_token = '') {
    return new Promise((resolve, reject) => {
      request(app)
        .post('/users/social-login')
        .send({
          provider_name,
          provider_uid,
          access_token
        })
        .set('Content-Type', 'application/json')
        .then((res) => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }
  emailCheck(email) {
    return new Promise((resolve, reject) => {
      request(app)
        .post('/accounts/email/check')
        .send({
          email
        })
        .set('Content-Type', 'application/json')
        .then((res) => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }
  forgot(email) {
    return new Promise((resolve, reject) => {
      request(app)
        .post('/passwords/forgot')
        .send({
          email
        })
        .set('Content-Type', 'application/json')
        .then((res) => {
          resolve(res.body);
        })
        .catch(err => {
          resolve(err);
        });
    });
  }
  updatePassword(email, oldPassword, newPassword) {
    return new Promise((resolve, reject) => {
      request(app)
        .put('/users/password')
        .send({
          email: "andrew@skyshi.com",
          password: "andrew",
          old_password: "andrew123"
        })

        .set('Content-Type', 'application/json')
        .then(res => {
          resolve(res.body)
        })
        .catch(err => {
          resolve(err);
        });
    });
  }
}

export default UserModel;
