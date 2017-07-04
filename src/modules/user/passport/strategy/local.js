import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../../model';
import { BadRequestError } from '../../../../../common/errors';
import { loginMsg, emailMsg } from '../../message';

export default new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: false,
}, (email, password, done) => {
  new User({ email_users: email }).fetch().then((user) => {
    if (!user) return done(new BadRequestError(emailMsg.not_found), false);
    return user.checkPasswordFromApi(password)
      .then((body) => {
        body = JSON.parse(body);
        if (!body.data) {
          return done(new BadRequestError(loginMsg.wrong_password), false);
        }
        return done(null, user.toJSON());
      });
  });
});
