import { GoogleUser, GoogleToken } from './google';
import { XOR } from './utils';

export type OfflinUser = { online: false; token: string };
export type OnlineUser = {
  online: true;
  token: GoogleToken;
  refreshToken: GoogleToken;
} & GoogleUser;
/**
 * Type referring to the info retrieved by Google API and the acess token from OAuth2
 */
export type User = XOR<OfflinUser, OnlineUser>;
