

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ProviderRequestsService } from './provider-requests.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

console.log("request ts cargado")


@Component({
  selector: 'app-provider-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './requests.html',
  styleUrls: ['./requests.scss']
})
export class ProviderRequestsComponent  implements OnInit {


/*missolicitudesproveedor:any[]=[]; */
requests$!: Observable<any[]>;

selectedRequest:any | null =null ; 

productos:any[]=[]; 



constructor(
  private requestService: ProviderRequestsService,
   
) {}





ngOnInit(): void {
   
  console.log("entrando al componente"); 


  // ✔ SOLO datos aquí (sin tap, sin lógica UI)
    this.requests$ = this.requestService.listarSolicitudes();

    // ✔ selección inicial (una sola vez)
    this.requests$.subscribe(data => {
      if (data?.length > 0) {
        this.selectRequest(data[0]);
      }
    });










  /* intento 2 con suscribe manual
  this.requestService.listarSolicitudes()
      .subscribe({




        next: (data: any[]) => {

          // ✔ SIEMPRE asegurar array
          this.missolicitudesproveedor = [...data ?? [] ];

          console.log("DATA:", this.missolicitudesproveedor);

          // ✔ selección inicial segura
          if (this.missolicitudesproveedor.length > 0) {
            this.selectRequest(this.missolicitudesproveedor[0]);
          }

        },
        error: (err) => {
          console.error("Error cargando solicitudes", err);
          this.missolicitudesproveedor = [];
        }
      });




*/








  
  /*
  this.requests$ = this.requestService.listarSolicitudes().pipe(
  tap(data => {
    if (data.length > 0) {
      this.selectedRequest = data[0];
      this.productos = data[0].detalles ?? [];
    }
  })
);

*/







  /*intento uno con suscribe
  this.requestService
    .listarSolicitudes()
    .subscribe({
        next:(data:any[]) =>{

        console.log("IS ARRAY:", Array.isArray(data));

        this.missolicitudesproveedor = [...data];

      /*console.log("REQUESTS:", this.missolicitudesproveedor);

      console.log("LENGTH:", this.missolicitudesproveedor.length); */

      
      

  /*
      if (this.missolicitudesproveedor.length > 0) {
        this.selectRequest(this.missolicitudesproveedor[0]);
        
      }


      console.log("solicitudes",    data); },

      error: (err) => { console.error( "error cargando solicitudes", err); }

    }); */
}


selectRequest(request: any) {

  this.selectedRequest = request;
  
  

  this.productos=request?.detalles ?? []; 

  /*this.productos = request.detalles ; */
  /*this.productos=request?.detalles  ?? []; */
  console.log("selectedRequest", request);
  console.log("productos", this.productos); 
}




getRfQCode(request: any): string {
  if (!request) return '';

  const year = new Date(request.fechaCreacion).getFullYear();

  const id = String(request.idSolicitud).padStart(4, '0');

  return `RFQ-${year}-${id}`;
}




getFecha(date: string) {
  return new Date(date).toLocaleDateString('es-PE');
}

getHora(date: string) {
  return new Date(date).toLocaleTimeString('es-PE');
}






getFechaCompleta(date?: string): string {

  if (!date){
   return ""; 
 }
  
  const fecha = new Date(date);

  const fechaTexto = fecha.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long'
  });

  const horaTexto = fecha.toLocaleTimeString('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `Recibida el ${fechaTexto} a las ${horaTexto}`;
}














}









