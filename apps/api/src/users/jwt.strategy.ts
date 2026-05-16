// apps/api/src/users/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        const secret = process.env.SUPABASE_JWT_SECRET;
        if (!secret) {
          console.error("CRITICAL: SUPABASE_JWT_SECRET is missing during runtime evaluation!");
          return done(new Error("Missing JWT Secret configuration on server"));
        }
        done(null, secret);
      },
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid or expired authentication token payload.');
    }
    return { userId: payload.sub, email: payload.email };
  }
}