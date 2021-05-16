import { RouterBuild } from "./route.builder";

export const AccountRoute = new RouterBuild("account", {
  auth: "auth",
  register: {
    verify: "verify",
    check: "check"
  }
});
