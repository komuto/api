import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../../model';
import { jwt as jwtOptions } from '../../../../../config';

const jwtParams = {
  secretOrKey: jwtOptions.secretOrKey,
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  passReqToCallback: true,
};
export default new JwtStrategy(jwtParams, async (req, jwtPayload, done) => {
  try {
    const user = await User.getWithPhone({ id_users: jwtPayload.id_users });
    if (!user) return done(null, false);
    return done(null, user.serialize(
      { pass: true, phone: true, notification: true }),
      req.marketplace.mobile_domain,
    );
  } catch (e) {
    return done(e, false);
  }
});
