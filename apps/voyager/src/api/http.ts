import ky from "ky";
import { ENDPOINTS } from "../constants";
import LoginStore from "../stores/login.store";

const authorizedRequestHooks = {
  beforeRequest: [
    (request: Request) => {
      request.headers.set("Bearer ", LoginStore.token);
    },
  ],
};

export const account = ky.extend({
  hooks: authorizedRequestHooks,
  prefixUrl: ENDPOINTS.ACCOUNT,
});

export const ride = ky.extend({
  hooks: authorizedRequestHooks,
  prefixUrl: ENDPOINTS.RIDES,
});
