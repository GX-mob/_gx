import { RouterBuild } from "./route.builder";

export const AuthRoute = new RouterBuild("account", {
  signin: {
    status: "status",
    credential: "credential",
    code: "code"
  },
  signup: {
    verify: "verify",
    check: "check"
  }
});
