import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductoService } from './producto-service';

describe('ProductoService: compatibilidad con listados sin paginación del API', () => {
  let service: ProductoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ProductoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('filtra y ordena antes de paginar, normalizando la categoría anidada', () => {
    service.listar(0, 1, 'precio', 'desc', 2).subscribe(pagina => {
      expect(pagina.totalElementos).toBe(2);
      expect(pagina.contenido[0].id).toBe(3);
      expect(pagina.contenido[0].categoriaNombre).toBe('Categoría');
    });
    http.expectOne(req => req.url.endsWith('/productos')).flush([
      { id: 1, precio: 10, categoria: { id: 2, nombre: 'Categoría' } },
      { id: 2, precio: 99, categoria: { id: 1, nombre: 'Otra' } },
      { id: 3, precio: 20, categoria: { id: 2, nombre: 'Categoría' } }
    ]);
  });

  it('ordena nombres alfabéticamente antes de tomar la página solicitada', () => {
    service.listar(1, 1, 'nombre', 'asc').subscribe(pagina => {
      expect(pagina.contenido[0].nombre).toBe('Beta');
      expect(pagina.totalElementos).toBe(3);
    });
    http.expectOne(req => req.url.endsWith('/productos')).flush([
      { id: 1, nombre: 'Zeta' }, { id: 2, nombre: 'Alfa' }, { id: 3, nombre: 'Beta' }
    ]);
  });
});
