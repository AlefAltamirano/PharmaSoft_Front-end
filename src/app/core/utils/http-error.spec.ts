import { HttpErrorResponse } from '@angular/common/http';
import { mensajeError } from './http-error';
describe('mensajes de error con seguimiento', () => {
  it('muestra el identificador enviado por el backend', () => {
    expect(mensajeError(new HttpErrorResponse({status:409,error:{message:'Nombre duplicado',requestId:'a1b2c3d4'}})))
      .toBe('Nombre duplicado Código de seguimiento: a1b2c3d4');
  });
  it('conserva compatibilidad con errores sin identificador', () => {
    expect(mensajeError(new HttpErrorResponse({status:403,error:{message:'Sin permiso'}}))).toBe('Sin permiso');
  });
});
