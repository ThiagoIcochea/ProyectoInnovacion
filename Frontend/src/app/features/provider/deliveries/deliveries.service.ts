




import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

import { DeliveryRequest } from './delivery.model'; 
import { TrackingStep } from './tracking-step.model';
import { DeliveryDetail } from './delivery-detail.model';


@Injectable({
  providedIn: 'root'
})
export class DeliveriesService {

  private apiUrl =
    'https://proyectoinnovacion.onrender.com';

  constructor(
    private http: HttpClient
  ) {}

  // =====================================
  // LISTAR PAGOS DEL PROVEEDOR
  // =====================================

  listarSolicitudesEntrega(): Observable<DeliveryRequest[]> {

    return this.http.get<DeliveryRequest[]>(
      `${this.apiUrl}/api/solicitudes/proveedor/entregas`
    );
  }


listarTrackingSolicitud(
      idSolicitud: number
  ): Observable<TrackingStep[]> {

    return this.http.get<
      TrackingStep[]
    >(

      `${this.apiUrl}/api/solicitudes/proveedor/solicitudes/${idSolicitud}/tracking`

    );

  }



listarDetallesEntrega(idSolicitud:number):
      Observable<DeliveryDetail[]> {

    return this.http.get<
      DeliveryDetail[]
    >(

      `${this.apiUrl}/api/solicitudes/proveedor/entregas/detalles`

    );

  }




  actualizarEstado(
    id: number,
    estado: string,
    codigo?: string
  ): Observable<void> {

    let params = new HttpParams()
      .set('estado', estado);

    if (codigo) {
      params = params.set('codigo', codigo);
    }

    return this.http.put<void>(
      `${this.apiUrl}/api/solicitudes/${id}/estado`,
      {},
      { params }
    );
  }












}






















