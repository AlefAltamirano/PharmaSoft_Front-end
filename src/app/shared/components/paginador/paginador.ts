import {Component,computed,input,output} from '@angular/core';
@Component({selector:'app-paginador',templateUrl:'./paginador.html',styles:['nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:16px}']})
export class Paginador {
 readonly pagina=input.required<number>(); readonly tamanio=input.required<number>();readonly totalPaginas=input.required<number>();readonly totalElementos=input.required<number>();
 readonly cambioPagina=output<number>();readonly cambioTamanio=output<number>();
 readonly desde=computed(()=>this.totalElementos()?this.pagina()*this.tamanio()+1:0);
 readonly hasta=computed(()=>Math.min((this.pagina()+1)*this.tamanio(),this.totalElementos()));
 ir(n:number){if(n>=0&&n<this.totalPaginas()&&n!==this.pagina())this.cambioPagina.emit(n);}
}
