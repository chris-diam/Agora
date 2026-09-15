import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export const hashPassword = (plainTextPassword: string): Promise<string> =>
  bcrypt.hash(plainTextPassword, SALT_ROUNDS);

export const comparePassword = (plainTextPassword: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plainTextPassword, hash);
