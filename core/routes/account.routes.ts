export function AccountRoute() {}

AccountRoute.BasePath = "account";

// Register
function AccountRegisterRoute() {
  return `${AccountRoute.BasePath}/register`
}

function AccountRegisterRouteVerify (fullRoute?: boolean) {
  return `${fullRoute ? `${AccountRegisterRoute()}/` : ''}verify`
}

function AccountRegisterRouteCheck (fullRoute?: boolean) {
  return `${fullRoute ? `${AccountRegisterRoute()}/` : ''}check`
}



AccountRegisterRoute.Verify = AccountRegisterRouteVerify;
AccountRegisterRoute.Check = AccountRegisterRouteCheck;
AccountRoute.Register = AccountRegisterRoute;

// Auth
function AccountAuthRoute() {
  return `${AccountRoute.BasePath}/auth`
}