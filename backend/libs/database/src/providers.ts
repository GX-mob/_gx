import { USER_MODEL_PROVIDER, UserModel } from "./models/user";
import { SESSION_MODEL_PROVIDER, SessionModel } from "./models/session";
import { PENDENCIE_MODEL_PROVIDER, PendencieModel } from "./models/pendencie";
import { RIDE_MODEL_PROVIDER, RideModel } from "./models/ride";

export const databaseModelsProviders = [
  {
    provide: USER_MODEL_PROVIDER,
    useFactory: () => UserModel,
  },
  {
    provide: SESSION_MODEL_PROVIDER,
    useFactory: () => SessionModel,
  },
  {
    provide: PENDENCIE_MODEL_PROVIDER,
    useFactory: () => RideModel,
  },
  {
    provide: RIDE_MODEL_PROVIDER,
    useFactory: () => PendencieModel,
  },
];
