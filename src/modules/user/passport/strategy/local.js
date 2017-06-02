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
    if (user.checkPassword(password)) {
      if (_.includes([Status.INACTIVE], user.get('status'))) {
        return done(null, false);
      }
      return done(null, user.toJSON());
    }
    return done(null, false);
  });
});
