export interface Loadable<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
}