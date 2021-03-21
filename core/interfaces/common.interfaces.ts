export interface IHttpError {
  statusCode: number;
  message: string;
  code?: string;
  error?: string;
}
