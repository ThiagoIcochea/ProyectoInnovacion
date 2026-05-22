






import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { Payment } from './payments.model';


@Injectable({
  providedIn: 'root'
})
export class PagoService {

  private apiUrl =
    'https://proyectoinnovacion.onrender.com';

  constructor(
    private http: HttpClient
  ) {}

  // =====================================
  // LISTAR PAGOS DEL PROVEEDOR
  // =====================================

  listarMisPagos(): Observable<Payment[]> {

    return this.http.get<Payment[]>(
      `${this.apiUrl}/api/pagos/proveedor/mis-pagos`
    );
  }


aprobarPago(idPago:number){

  return this.http.put(
    `${this.apiUrl}/api/pagos/${idPago}/aprobar`,
    {}
  );

}



}





















