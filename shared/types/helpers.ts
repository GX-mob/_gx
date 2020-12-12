export type ValueOf<T> = T[keyof T];

export type Callback<Args extends any[] = any[], Return = void> = (
  ...args: Args
) => Return;
