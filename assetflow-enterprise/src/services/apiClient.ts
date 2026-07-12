import { delay } from "./store";

export const apiClient = {
  get: <T>(data: T) => delay(data),
  mutate: <T>(fn: () => T) => delay(fn(), 220),
};
