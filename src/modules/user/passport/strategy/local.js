import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../../model';
import { BadRequestError } from '../../../../../common/errors';
import { loginMsg, emailMsg } from '../../message';
import { utils } from '../../../core';

const { formatSingularErr } = utils;

export default new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: false,
}, async (email, password, done) => {
  const user = await User.getWithPhone({ email_users: email });
  if (!user) return done(new BadRequestError(loginMsg.title, formatSingularErr('email', emailMsg.not_found)), false);
  const check = await User.checkPasswordFromApi(password, user.get('password_users'));
  if (!check) {
    return done(new BadRequestError(loginMsg.title, formatSingularErr('password', loginMsg.wrong_password)), false);
  }
  return done(null, user.serialize({ phone: true }));
});
