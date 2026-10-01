import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { CategoriaList } from './categoria-list';

describe('CategoriaList', () => {
  let component: CategoriaList;
  let fixture: ComponentFixture<CategoriaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaList],
      providers: [provideHttpClient(), provideRouter([])]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CategoriaList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
