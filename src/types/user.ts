import { GoogleUser, GoogleToken } from "./google";
import { XOR } from "./utils";

export type OfflineUser = {
  online: false;
  function?: FunctionType;
  token: string;
};
export type OnlineUser = {
  online: true;
  function?: FunctionType;
  token: GoogleToken;
  refreshToken: GoogleToken;
} & GoogleUser;

export enum FunctionType {
  DATASET = "DATA_SET",
  ANONYMIZER = "ANONYMIZER",
}
/**
 * Type referring to the info retrieved by Google API and the acess token from OAuth2
 */
export type User = XOR<OfflineUser, OnlineUser>;
