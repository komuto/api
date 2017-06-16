import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../../model';
import { jwt as jwtOptions } from '../../../../../config';

const jwtParams = {
  secretOrKey: jwtOptions.secretOrKey,
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
};
export default new JwtStrategy(jwtParams, (jwtPayload, done) => {
  new User({ id_users: jwtPayload.id_users }).fetch()
    .then((user) => {
      if (!user) return done(null, false);
      return done(null, user.toJSON());
    })
    .catch(e => done(e, false));
});
