import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoEncontrado } from './no-encontrado';

describe('NoEncontrado', () => {
  let component: NoEncontrado;
  let fixture: ComponentFixture<NoEncontrado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoEncontrado],
      providers: [provideRouter([])]
    })
      .compileComponents();

    fixture = TestBed.createComponent(NoEncontrado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
