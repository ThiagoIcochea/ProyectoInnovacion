import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DeliveriesService } from './deliveries.service';
import { DeliveryRequest } from './delivery.model';
import { TrackingStep } from './tracking-step.model';
import { DeliveryDetail } from './delivery-detail.model';

@Component({
  selector: 'app-provider-deliveries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deliveries.html',
  styleUrls: ['./deliveries.scss']
})
export class ProviderDeliveriesComponent implements OnInit {

  
deliveries$: Observable<DeliveryRequest[]> = of([]);

tracking$: Observable<TrackingStep[]> = of([]);

details$: Observable<DeliveryDetail[]> = of([]);

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















}















