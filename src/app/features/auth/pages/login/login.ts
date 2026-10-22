import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth-service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly returnUrl = input<string | undefined>();
  readonly expirada = input<string | undefined>();
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  iniciarSesion(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(this.destinoSeguro()),
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        this.error.set(error.status === 401
          ? 'Usuario o contraseña incorrectos.'
          : 'No fue posible iniciar sesión. Inténtalo nuevamente.');
      }
    });
  }

  private destinoSeguro(): string {
    const destino = this.returnUrl();
    return destino && destino.startsWith('/') && !destino.startsWith('//')
      ? destino
      : '/inicio';
  }
}
