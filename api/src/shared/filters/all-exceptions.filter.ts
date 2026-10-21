import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { STATUS_CODES } from 'node:http';

export type ErrorBody = {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
};

// Padrão global de erro: { statusCode, error, message, details? }.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response
        .status(status)
        .json(this.fromHttpException(status, exception.getResponse()));
      return;
    }

    // Erros do body parser (JSON malformado, payload grande) trazem status 4xx.
    const clientStatus = this.clientErrorStatus(exception);
    if (clientStatus) {
      const body: ErrorBody = {
        statusCode: clientStatus,
        error: STATUS_CODES[clientStatus] ?? 'Bad Request',
        message:
          clientStatus === 400
            ? 'Corpo da requisição inválido.'
            : (STATUS_CODES[clientStatus] ?? 'Requisição inválida.'),
      };
      response.status(clientStatus).json(body);
      return;
    }

    // Não logamos message/stack: erros do Drizzle/pg incluem os parâmetros da
    // query (ex.: password_hash). Só nome e código do erro.
    this.logger.error(this.safeDescription(exception));

    const body: ErrorBody = {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Erro interno do servidor.',
    };
    response.status(500).json(body);
  }

  private fromHttpException(
    status: number,
    payload: string | object,
  ): ErrorBody {
    const fallbackError = STATUS_CODES[status] ?? 'Error';

    if (typeof payload === 'string') {
      return { statusCode: status, error: fallbackError, message: payload };
    }

    const { message, error, details } = payload as {
      message?: string | string[];
      error?: string;
      details?: unknown;
    };

    const body: ErrorBody = {
      statusCode: status,
      error: error ?? fallbackError,
      message: Array.isArray(message)
        ? message.join('; ')
        : (message ?? fallbackError),
    };

    if (details !== undefined) body.details = details;

    return body;
  }

  private clientErrorStatus(exception: unknown): number | null {
    const status = (exception as { status?: unknown })?.status;
    const expose = (exception as { expose?: unknown })?.expose;

    return typeof status === 'number' && status >= 400 && status < 500 && expose
      ? status
      : null;
  }

  private safeDescription(exception: unknown): string {
    if (!(exception instanceof Error)) return 'Unhandled non-error exception';

    const cause = (exception as { cause?: { code?: string } }).cause;
    const code = cause?.code ? ` (code ${cause.code})` : '';

    return `Unhandled ${exception.name}${code}`;
  }
}
