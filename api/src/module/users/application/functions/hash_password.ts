import * as argon2 from 'argon2';

const PASSWORD_HASH_OPTIONS = {
  type: argon2.argon2id,
  timeCost: 3,
  memoryCost: 65536,
  parallelism: 4,
} as const;

export async function hashPassword(password: string) {
  const password_hash = await argon2.hash(password, PASSWORD_HASH_OPTIONS);
  return password_hash;
}

export async function matchPassword(
  password_hash: string,
  body_password: string,
) {
  const passwordValid = await argon2.verify(password_hash, body_password);
  return passwordValid;
}
