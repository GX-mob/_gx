interface HttpExceptionInterface {
  message: string;
  statusCode: number;
  error?: string;
}

export class HttpException extends Error implements HttpExceptionInterface {
  statusCode!: number;
  constructor(httpErrorObject: HttpExceptionInterface) {
    const { message, ...rest } = httpErrorObject;
    super(message);
    Object.assign(this, rest);
  }
}
