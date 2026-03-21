import { randomInt } from "crypto";

import { hashValue } from "../../utils/crypto";

export const otpService = {
  generate(length = 6) {
    const max = Math.pow(10, length);
    const code = randomInt(0, max).toString().padStart(length, "0");

    return {
      code,
      hash: hashValue(code)
    };
  },

  verify(code: string, hash: string): boolean {
    return hashValue(code) === hash;
  }
};
