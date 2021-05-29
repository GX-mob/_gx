import { RouterBuild } from "./route.builder";

export const AccountRoute = new RouterBuild("account", {
  profile: {
    avatar: "avatar",
  },
  contact: {
    "request-verifaction": "request-verifaction/:contact",
  },
  security: {
    password: "password",
    ["2fa"]: {
      enable: "enable",
      disable: "disable",
    },
  },
});

AccountRoute.route("contact").route("request-verifaction", {
  replaceParams: { contact: "5582" },
});
