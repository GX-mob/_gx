import * as Device from "expo-device";

export const IS_WEB = Device.brand === null;
export const GOOGLE_OAUTH_ID =
  "190699413732-i81jlb46op5q7t189bbee0iq5n73akkt.apps.googleusercontent.com";
export const ENDPOINTS = {
  ACCOUNT: "http://192.168.0.105:3000/account/",
  LOGIN: "http://192.168.0.105:3000/user/auth/",
  REGISTER: "http://192.168.0.105:3000/user/register/",
  RIDES: "http://192.168.0.105:3000/rides/",
  RUN: "http://192.168.0.105:3001/",
};

export const TOKEN_STORAGE_KEY = "token";

export const NOT_FOUND_RESPONSES_TO_INDICATE_ACCOUNT_CREATION = 6;

export const VERIFICATION_RESEND_TIMEOUT = 60;

export const MINIMUN_REGISTER_AGE = -18;
export const MAXIMUN_REGISTER_AGE = -70;
