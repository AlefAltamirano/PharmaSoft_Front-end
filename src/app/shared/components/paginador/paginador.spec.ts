import { TestBed } from '@angular/core/testing';
import { Paginador } from './paginador';
describe('Paginador',()=>{
 it('bloquea extremos y emite cambios de página válidos',()=>{
  let f=TestBed.createComponent(Paginador);
  for(const [key,value] of Object.entries({pagina:0,tamanio:20,totalPaginas:3,totalElementos:45}))f.componentRef.setInput(key,value);
  f.detectChanges();let changes:number[]=[];f.componentInstance.cambioPagina.subscribe(v=>changes.push(v));
  expect(f.nativeElement.querySelector('[aria-label="Primera página"]').disabled).toBe(true);
  f.componentInstance.ir(-1);f.componentInstance.ir(3);expect(changes).toEqual([]);
  f.componentInstance.ir(1);expect(changes).toEqual([1]);
 });
});
