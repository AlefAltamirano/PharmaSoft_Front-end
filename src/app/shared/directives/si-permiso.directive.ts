import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/auth/auth-service';
import { Permiso } from '../../core/auth/auth.model';

@Directive({
  selector: '[appSiPermiso]',
  standalone: true
})
export class SiPermisoDirective {
  private readonly auth = inject(AuthService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  readonly visible = input.required<Permiso>({ alias: 'appSiPermiso' });

  constructor() {
    effect(() => {
      this.viewContainer.clear();
      if (this.auth.tienePermiso(this.visible())) {
        this.viewContainer.createEmbeddedView(this.template);
      }
    });
  }
}
