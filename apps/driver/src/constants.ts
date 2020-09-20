import * as Device from "expo-device";

export const IS_WEB = Device.brand === null;
export const GOOGLE_OAUTH_WEB_ID =
  "190699413732-tk69et2mj4md7i2kq0ndubmcsp80vfmf.apps.googleusercontent.com";
export const GOOGLE_OAUTH_ID =
  "190699413732-i81jlb46op5q7t189bbee0iq5n73akkt.apps.googleusercontent.com";
export const ENDPOINTS = {
  AUTH: "http://192.168.0.105:8081",
  ACCOUNT: "http://192.168.0.105:8082",
  SIGNIN: "http://192.168.0.105:8082",
  REGISTRY: "http://192.168.0.105:8080",
  RIDES: "http://192.168.0.105:8083",
  RUN: "http://192.168.0.105:8084",
};
