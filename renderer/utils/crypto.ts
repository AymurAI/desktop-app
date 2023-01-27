import { createHash, randomBytes } from 'crypto';

// Generate a random verifier phrase at the start of the code
const VERIFIER_PHRASE = randomBytes(32).toString('base64');

/**
 * Converts a data buffer into the desired `base64` format
 * @param buffer Bytes buffer
 * @returns A 43 in lengthstring
 */
function toBase64(buffer: Buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Hashes a string using `sha256` algorithm
 * @param str `string` to hash
 * @returns A hashed version of the string
 */
function sha256(str: string) {
  return createHash('sha256').update(str).digest();
}

/**
 * Creates the PKCE OAuth2 verifier code
 * @returns The verifier code in `string` format
 */
function getVerifierCode() {
  if (!VERIFIER_PHRASE) {
    throw new Error(
      'VERIFIER_PHRASE not found! Check your .env file before packaging the app!'
    );
  }
  const buffer = Buffer.from(VERIFIER_PHRASE, 'utf-8');
  return toBase64(buffer);
}

/**
 * Creates the PKCE OAuth2 challenge code
 * @returns The challenge code in `string` format
 */
function getChallengeCode() {
  const verifier = getVerifierCode();

  const challenge = toBase64(sha256(verifier));
  return challenge;
}

const crypto = {
  getChallengeCode,
  getVerifierCode,
};
export default crypto;
