import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../../model';
import { loginError } from '../../error';

export default new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: false,
}, async (email, password, done) => {
  const user = await User.getWithPhone({ email_users: email });
  if (!user) return done(loginError('email', 'email_not_found'), false);
  const check = await User.checkPasswordFromApi(password, user.get('password_users'));
  if (!check) {
    return done(loginError('password', 'wrong_password'), false);
  }
  return done(null, user.serialize({ phone: true }));
});
