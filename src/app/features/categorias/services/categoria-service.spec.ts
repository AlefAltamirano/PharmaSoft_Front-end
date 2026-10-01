import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { CategoriaService } from './categoria-service';

describe('CategoriaService', () => {
  let service: CategoriaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(CategoriaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
