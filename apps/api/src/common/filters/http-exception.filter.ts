import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Something went wrong.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        message = payload;
        code = exception.name.replace(/Exception$/, '').toUpperCase() || 'ERROR';
      } else if (typeof payload === 'object' && payload) {
        const body = payload as Record<string, unknown>;
        message = (body.message as string) || (body.error as string) || message;
        if (Array.isArray(body.message)) {
          message = body.message.join(', ');
        }
        code = (body.code as string) || String(body.error || 'ERROR').toString().toUpperCase().replace(/\s+/g, '_');
      }
    } else {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      error: { code, message },
    });
  }
}
