import { tokenService, type AuthRole } from "./token.service";

export const sessionService = {
  createSession(params: { userId: string; role: AuthRole }) {
    return tokenService.issueTokens({
      sub: params.userId,
      role: params.role
    });
  }
};
