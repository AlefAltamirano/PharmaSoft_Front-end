import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { Permiso } from '../../core/auth/auth.model';
import { AuthService } from '../../core/auth/auth-service';

@Directive({ selector: '[appSiPermiso]' })
export class SiPermiso {
  readonly appSiPermiso = input.required<Permiso>();
  private readonly auth = inject(AuthService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly container = inject(ViewContainerRef);

  constructor() {
    effect(() => {
      this.container.clear();
      if (this.auth.tienePermiso(this.appSiPermiso())) {
        this.container.createEmbeddedView(this.template);
      }
    });
  }
}
