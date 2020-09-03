import { SetMetadata } from "@nestjs/common";

export const Voyager = () => SetMetadata("roles", ["voyager"]);
export const Driver = () => SetMetadata("roles", ["driver"]);
export const Roles = (...roles: string[]) => SetMetadata("roles", roles);
