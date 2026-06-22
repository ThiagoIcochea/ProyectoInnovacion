import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DeliveriesService } from './deliveries.service';
import { DeliveryRequest } from './delivery.model';
import { TrackingStep } from './tracking-step.model';
import { DeliveryDetail } from './delivery-detail.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-provider-deliveries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deliveries.html',
  styleUrls: ['./deliveries.scss']
})
export class ProviderDeliveriesComponent implements OnInit {

  
deliveries$: Observable<DeliveryRequest[]> = of([]);

tracking$: Observable<TrackingStep[]> = of([]);

details$: Observable<DeliveryDetail[]> = of([]);

estadoSeleccionado: string = '';
codigoEntrega: string = '';

guardando: boolean = false;

  selectedRequest:
      DeliveryRequest | null = null;

  constructor(
      private deliveriesService:
      DeliveriesService
  ) {}

  ngOnInit(): void {

    this.recargarSolicitudes();

     

  }

  // =========================
  // RECARGAR
  // =========================

  recargarSolicitudes(): void {

    this.deliveries$ =
      this.deliveriesService
        .listarSolicitudesEntrega()
        .pipe(

          tap((data) => {


             if (data.length > 0) {

              this.selectedRequest =
                data[0];

              // cargar tracking inicial

              this.cargarTracking(
                  data[0].idSolicitud
              );


               this.cargarDetalles(
                  data[0].idSolicitud
              );


            }else{


                  this.selectedRequest = null;
                  this.tracking$ = of([]);
                  this.details$ = of([]);


            }


            
              console.log(data);

            //this.selectedRequest =
            //  data.length > 0
             //   ? data[0]
             //   : null;

          })

        );

  }

  // =========================
  // SELECCIONAR
  // =========================

  seleccionarSolicitud(
      solicitud: DeliveryRequest
  ): void {

    this.selectedRequest = solicitud;

    this.cargarTracking(
        solicitud.idSolicitud
    );


// detalles

    this.cargarDetalles(
        solicitud.idSolicitud
    );





  }



cargarTracking(
      idSolicitud: number
  ): void {

    this.tracking$ =

      this.deliveriesService
        .listarTrackingSolicitud(
            idSolicitud
        );

  }




cargarDetalles(
      idSolicitud: number
  ): void {

    this.details$ =

      this.deliveriesService
        .listarDetallesEntrega(
            idSolicitud
        );

  }




actualizarTracking(): void {

   if (this.guardando) {
    return;
  }

  if (!this.selectedRequest) {
    return;
  }

  this.guardando = true;

  // ✔ validar estado
    if (!this.estadoSeleccionado) {
      alert('Debes seleccionar un estado');
      return;
    }

  // VALIDACIÓN FRONTEND
  if (
    this.estadoSeleccionado === 'ENTREGADA' &&
    !this.codigoEntrega
  ) {
    alert('Debes ingresar el código de entrega');
    return;
  }

  this.deliveriesService
      .actualizarEstado(
        this.selectedRequest.idSolicitud,
        this.estadoSeleccionado,
        this.codigoEntrega
      )
      .subscribe({
        next: () => {

          if(this.selectedRequest){
          // refrescar tracking
          this.cargarTracking(this.selectedRequest!.idSolicitud);

          // refrescar detalles (opcional)
          this.cargarDetalles(this.selectedRequest!.idSolicitud);
           }

          // limpiar input
          this.codigoEntrega = '';

          // opcional: refrescar lista principal
          this.recargarSolicitudes();
        },
        error: (err) => {
          console.error(err);
          alert('Error al actualizar estado');
        }
      });
}






getFecha(date?: string) {
  if (!date){
   return ""; 
 }
  return new Date(date).toLocaleDateString('es-PE');
}


getHora(date: string) {
  if (!date){
   return ""; 

 }

  return new Date(date).toLocaleTimeString('es-PE');
}








getOrCode(deliverie: any): string {
  if (!deliverie) return '';

  const fecha = deliverie.fechaCreacion  || deliverie.fechaPago;
  const year = new Date(fecha).getFullYear();

  const id = String(deliverie.idSolicitud).padStart(4, '0');

  return `OR-${year}-${id}`;
}










}















