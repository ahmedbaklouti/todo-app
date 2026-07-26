import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

function getDefaultErrorLabel(status: number) {
  const labelsByStatus: Record<number, string> = {
    400: 'Requete invalide',
    401: 'Non autorise',
    403: 'Acces refuse',
    404: 'Introuvable',
    409: 'Conflit',
    500: 'Erreur interne du serveur',
  };

  return labelsByStatus[status] ?? 'Erreur';
}

function translateErrorLabel(error: string, status: number) {
  const normalizedError = error.trim();

  const translations = new Map<string, string>([
    ['Bad Request', 'Requete invalide'],
    ['Unauthorized', 'Non autorise'],
    ['Forbidden', 'Acces refuse'],
    ['Not Found', 'Introuvable'],
    ['Conflict', 'Conflit'],
    ['Internal Server Error', 'Erreur interne du serveur'],
  ]);

  return translations.get(normalizedError) ?? getDefaultErrorLabel(status);
}

function translateValidationMessage(message: string) {
  const trimmedMessage = message.trim();

  const propertyShouldNotExistMatch = trimmedMessage.match(
    /^property ([^ ]+) should not exist$/i,
  );

  if (propertyShouldNotExistMatch) {
    return `Le champ "${propertyShouldNotExistMatch[1]}" n'est pas autorise.`;
  }

  const translations: Array<[RegExp, string]> = [
    [/^(.+) must be a string$/i, '$1 doit etre un texte.'],
    [/^(.+) should not be empty$/i, '$1 est obligatoire.'],
    [
      /^(.+) must be longer than or equal to (\d+) characters$/i,
      '$1 doit contenir au moins $2 caracteres.',
    ],
    [/^(.+) must be an email$/i, '$1 doit etre une adresse email valide.'],
    [/^(.+) must be a boolean value$/i, '$1 doit etre un booleen.'],
    [
      /^(.+) must be a valid ISO 8601 date string$/i,
      '$1 doit etre une date valide.',
    ],
  ];

  for (const [pattern, replacement] of translations) {
    if (pattern.test(trimmedMessage)) {
      return trimmedMessage.replace(pattern, replacement);
    }
  }

  return trimmedMessage;
}

function translateExceptionMessage(message: string | string[]) {
  if (Array.isArray(message)) {
    const translatedMessages = message.map((entry) =>
      translateValidationMessage(entry),
    );

    return translatedMessages.length === 1
      ? translatedMessages[0]
      : translatedMessages;
  }

  return translateValidationMessage(message);
}

function normalizeExceptionMessage(
  status: number,
  exceptionResponse: unknown,
): string | string[] {
  if (typeof exceptionResponse === 'string' && exceptionResponse.trim()) {
    return translateExceptionMessage(exceptionResponse);
  }

  if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
    const message =
      'message' in exceptionResponse ? exceptionResponse.message : null;

    if (typeof message === 'string' && message.trim()) {
      return translateExceptionMessage(message);
    }

    if (Array.isArray(message)) {
      const normalizedMessages = message.filter(
        (entry): entry is string =>
          typeof entry === 'string' && entry.trim().length > 0,
      );

      if (normalizedMessages.length > 0) {
        return translateExceptionMessage(normalizedMessages);
      }
    }
  }

  return status === 500
    ? 'Une erreur interne est survenue.'
    : 'Une erreur est survenue.';
}

function normalizeExceptionError(status: number, exceptionResponse: unknown) {
  if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
    const error = 'error' in exceptionResponse ? exceptionResponse.error : null;

    if (typeof error === 'string' && error.trim()) {
      return translateErrorLabel(error, status);
    }
  }

  return getDefaultErrorLabel(status);
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : 'Une erreur interne est survenue.';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: normalizeExceptionMessage(status, exceptionResponse),
      error: normalizeExceptionError(status, exceptionResponse),
    });
  }
}
