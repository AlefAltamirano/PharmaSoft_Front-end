import {CurrencyPipe} from '@angular/common';
import {HttpErrorResponse} from '@angular/common/http';
import {Component,computed,inject,input,linkedSignal,numberAttribute} from '@angular/core';
import {rxResource,toSignal} from '@angular/core/rxjs-interop';
import {Router,RouterLink} from '@angular/router';
import {CategoriaService} from '../../../categorias/services/categoria-service';
import {ProductoService} from '../../services/producto-service';
import {Producto,OrdenProducto,Direccion} from '../../models/producto.model';
import {PaginaResponse} from '../../../../core/models/pagina-response';
import {mensajeError} from '../../../../core/utils/http-error';
import {SiPermisoDirective} from '../../../../shared/directives/si-permiso.directive';
import {Paginador} from '../../../../shared/components/paginador/paginador';
@Component({selector:'app-producto-list',imports:[CurrencyPipe,RouterLink,SiPermisoDirective,Paginador],templateUrl:'./producto-list.html',styleUrl:'./producto-list.css'})
export class ProductoList {
 private readonly service=inject(ProductoService);private readonly router=inject(Router);
 readonly pagina=input(0,{transform:(v:unknown)=>numberAttribute(v,0)});readonly tamanio=input(20,{transform:(v:unknown)=>numberAttribute(v,20)});
 readonly orden=input<OrdenProducto,unknown>('nombre',{transform:v=>(v??'nombre') as OrdenProducto});readonly dir=input<Direccion,unknown>('asc',{transform:v=>(v??'asc') as Direccion});readonly categoriaId=input(0,{transform:(v:unknown)=>numberAttribute(v,0)});
 protected readonly categorias=toSignal(inject(CategoriaService).listar(),{initialValue:[]});
 protected readonly recurso=rxResource({params:()=>({pagina:this.pagina(),tamanio:this.tamanio(),orden:this.orden(),dir:this.dir(),categoria:this.categoriaId()}),stream:({params:p})=>this.service.listar(p.pagina,p.tamanio,p.orden,p.dir,p.categoria||null)});
 protected readonly resultado=linkedSignal<PaginaResponse<Producto>|undefined,PaginaResponse<Producto>|undefined>({source:()=>this.recurso.value(),computation:(n,p)=>n??p?.value});
 protected readonly productos=computed(()=>this.resultado()?.contenido??[]);
 protected readonly cargando=computed(()=>this.recurso.isLoading());
 protected readonly error=computed(()=>this.recurso.error()?mensajeError(this.recurso.error() as HttpErrorResponse):null);
 private navegar(q:Record<string,string|number|null>){void this.router.navigate([],{queryParams:q,queryParamsHandling:'merge'});}
 protected irA(pagina:number){this.navegar({pagina});}
 protected cambiarTamanio(tamanio:number){this.navegar({tamanio,pagina:0});}
 protected ordenar(campo:OrdenProducto){this.navegar({orden:campo,dir:this.orden()===campo&&this.dir()==='asc'?'desc':'asc',pagina:0});}
 protected filtrarPorCategoria(event:Event){this.navegar({categoriaId:Number((event.target as HTMLSelectElement).value)||null,pagina:0});}
 protected darDeBaja(producto:Producto){if(producto.estado&&confirm(`¿Dar de baja ${producto.nombre}?`))this.service.darDeBaja(producto.id).subscribe({next:()=>this.recurso.reload()});}
}
