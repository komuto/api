import _ from 'lodash';
import { Strategy as LocalStrategy } from 'passport-local';
import { User, UserStatus } from '../../model';
import { BadRequestError } from '../../../../../common/errors';

export default new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: false,
}, (email, password, done) => {
  new User({ email_users: email }).fetch().then((user) => {
    if (!user) return done(new BadRequestError('Email belum terdaftar'), false);
    return user.checkPasswordFromApi(password)
      .then((body) => {
        body = JSON.parse(body);
        if (!body.data) {
          return done(new BadRequestError('Password salah'), false);
        }
        return done(null, user.toJSON());
      });
  });
});
