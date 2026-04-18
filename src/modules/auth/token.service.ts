import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

import { env } from "../../config/env";

export type AuthRole = "client" | "coach";

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  role: AuthRole;
}

const ISSUER = "traingrid";
const AUDIENCE = "traingrid-app";

function signToken(payload: AuthTokenPayload, secret: string, expiresIn: string): string {
  const options: SignOptions = {
    algorithm: "HS256",
    expiresIn: expiresIn as any,
    issuer: ISSUER,
    audience: AUDIENCE
  };
  return jwt.sign(payload, secret, options);
}

export const tokenService = {
  issueTokens(payload: AuthTokenPayload) {
    const accessToken = signToken(
      payload,
      env.JWT_ACCESS_SECRET,
      env.JWT_ACCESS_TTL
    );
    const refreshToken = signToken(
      payload,
      env.JWT_REFRESH_SECRET,
      env.JWT_REFRESH_TTL
    );

    return {
      tokenType: "Bearer",
      accessToken,
      refreshToken,
      accessTokenExpiresIn: env.JWT_ACCESS_TTL,
      refreshTokenExpiresIn: env.JWT_REFRESH_TTL
    };
  },

  verifyAccessToken(token: string): AuthTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE
    }) as AuthTokenPayload;
  },

  verifyRefreshToken(token: string): AuthTokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE
    }) as AuthTokenPayload;
  }
};
