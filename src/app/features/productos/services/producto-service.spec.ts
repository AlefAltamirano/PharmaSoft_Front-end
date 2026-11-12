import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductoService } from './producto-service';
describe('ProductoService paginado',()=>{
 it('envía página, filtro y orden al servidor y normaliza categoría',()=>{
  TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});
  let service=TestBed.inject(ProductoService), http=TestBed.inject(HttpTestingController);
  service.listar(2,20,'precio','desc',4).subscribe(p=>{expect(p.pagina).toBe(2);expect(p.totalElementos).toBe(60);expect(p.contenido[0].categoriaNombre).toBe('Categoría');});
  let request=http.expectOne(r=>r.url.endsWith('/productos')&&r.params.get('pagina')==='2'&&r.params.get('categoriaId')==='4'&&r.params.get('ordenarPor')==='precio');
  request.flush({contenido:[{id:1,categoria:{id:4,nombre:'Categoría'}}],pagina:2,tamanio:20,totalElementos:60,totalPaginas:3,ultima:true});http.verify();
 });
});
