import { HttpErrorResponse } from '@angular/common/http';
import { ErrorResponse } from '../models/error-response';

export function mensajeError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'No se pudo conectar con el servidor. Verifique que el backend esté en ejecución y que CORS permita este origen.';
  }
  const mensajes: Record<number, string> = {
    400: 'La solicitud no es válida. Revise los datos ingresados.',
    401: 'La sesión no es válida o las credenciales son incorrectas.',
    403: 'No tiene permisos para realizar esta acción.',
    404: 'El recurso solicitado no fue encontrado.',
    409: 'La operación no puede completarse porque existe un conflicto con los datos.'
  };
  const cuerpo = err.error as ErrorResponse | null;
  return cuerpo?.message ?? mensajes[err.status] ?? `Error ${err.status}: ${err.statusText}`;
}

export function erroresDeValidacion(err: HttpErrorResponse): Record<string, string> {
  const cuerpo = err.error as ErrorResponse | null;
  return cuerpo?.validationErrors ?? {};
}