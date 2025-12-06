import "axios";

declare module "axios" {
  // This is due an intercepter we have set where we return `response.data` directly.
  export interface AxiosResponse<T = unknown> extends Promise<T> {}
}
