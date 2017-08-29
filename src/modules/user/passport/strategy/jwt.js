import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../../model';
import { jwt as jwtOptions } from '../../../../../config';

const jwtParams = {
  secretOrKey: jwtOptions.secretOrKey,
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
};
export default new JwtStrategy(jwtParams, async (jwtPayload, done) => {
  try {
    const user = await User.getWithPhone({ id_users: jwtPayload.id_users });
    if (!user) return done(null, false);
    return done(null, user.serialize({ pass: true, phone: true, notification: true }));
  } catch (e) {
    return done(e, false);
  }
});
