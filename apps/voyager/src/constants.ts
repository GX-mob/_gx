import * as Device from "expo-device";

export const IS_WEB = Device.brand === null;
export const GOOGLE_OAUTH_WEB_ID =
  "190699413732-tk69et2mj4md7i2kq0ndubmcsp80vfmf.apps.googleusercontent.com";
export const GOOGLE_OAUTH_ID =
  "190699413732-i81jlb46op5q7t189bbee0iq5n73akkt.apps.googleusercontent.com";
export const ENDPOINTS = {
  ACCOUNT: "http://192.168.0.105:3000/account",
  SIGNIN: "http://192.168.0.105:3000/sign-in",
  REGISTRY: "http://192.168.0.105:3000/sign-up",
  RIDES: "http://192.168.0.105:3000/rides",
  RUN: "http://192.168.0.105:3001",
};

export const TOKEN_STORAGE_KEY = "token";

export const NOT_FOUND_RESPONSES_TO_SUGGEST_WRONG_NUMBER = 3;
export const NOT_FOUND_RESPONSES_TO_INDICATE_ACCOUNT_CREATION = 6;
