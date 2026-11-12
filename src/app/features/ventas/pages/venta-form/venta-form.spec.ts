import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { VentaForm } from './venta-form';
import { vi, afterEach } from 'vitest';
afterEach(()=>vi.useRealTimers());

describe('VentaForm', () => {
  it('muestra en la confirmación el cliente elegido después de cambiarlo', async () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [VentaForm],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    });
    const fixture = TestBed.createComponent(VentaForm);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    vi.advanceTimersByTime(300);
    http.expectOne(req => req.url.includes('/clientes/buscar')).flush([
      { id: 1, dni: '11111111', nombres: 'Ana', apellidos: 'Uno', estado: true },
      { id: 2, dni: '22222222', nombres: 'Beatriz', apellidos: 'Dos', estado: true }
    ]);
    http.expectOne(req => req.url.includes('/productos/buscar')).flush([
      { id: 1, nombre: 'Producto', precio: 10, stock: 5, estado: true }
    ]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const click = (text: string) => {
      const button = Array.from(root.querySelectorAll('button')).find(b => b.textContent?.includes(text));
      expect(button).toBeDefined();
      button!.click();
      fixture.detectChanges();
    };
    click('Ana Uno');
    click('Producto ·');
    root.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(root.querySelector('.confirmacion')!.textContent).toContain('Ana');
    click('Editar');
    const input = root.querySelector('input')!;
    input.value = '';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    click('Beatriz Dos');
    root.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(root.querySelector('.confirmacion')!.textContent).toContain('Beatriz');
    expect(root.querySelector('.confirmacion')!.textContent).not.toContain('Ana');
    http.verify();
    fixture.destroy();
  });
});
