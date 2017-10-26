import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../../model';
import { loginError } from '../../messages';

export default new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
}, async (req, email, password, done) => {
  const user = await User.getWithPhone({
    email_users: email,
    id_marketplaceuser: req.marketplace.id,
  });
  if (!user) return done(loginError('email', 'email_not_found', true), false);
  try {
    const check = await User.checkPasswordFromApi(password, user.get('password_users'));
    if (!check) {
      return done(loginError('password', 'wrong_password', true), false);
    }
    return done(null, user.serialize({ phone: true }));
  } catch (e) {
    return done(loginError('api', 'bad_request', true), false);
  }
});
