export interface ValueObject<T> {
  value: T;
  validate(): void
}