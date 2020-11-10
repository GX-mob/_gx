export interface IHttpExceptionBase<Message = any> {
  message: Message;
  statusCode: number;
  error?: string;
}
