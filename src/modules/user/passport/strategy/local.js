import _ from 'lodash';
import { Strategy as LocalStrategy } from 'passport-local';
import { User, Status } from '../../model';

export default new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: false,
}, (email, password, done) => {
  new User({ email_users: email }).fetch().then((user) => {
    if (!user) return done(null, false);
    return user.checkPasswordFromApi(password)
      .then((body) => {
        body = JSON.parse(body);
        if (body.data) {
          if (_.includes([Status.ACTIVE], user.get('status_users'))) {
            return done(null, user.toJSON());
          }
        }
        return done(null, false);
      });
  });
});
