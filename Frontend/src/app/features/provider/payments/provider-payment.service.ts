






import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { Payment } from './payments.model';


@Injectable({
  providedIn: 'root'
})
export class PagoService {

  private apiUrl =
    'http://localhost:8080';

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

  
  
  return this.http.put<{ mensaje: string }>(
    `/api/pagos/${idPago}/aprobar`,
    {}
  );


  
  
  
  
  
  
  
  
  /*return this.http.put(
    `${this.apiUrl}/api/pagos/${idPago}/aprobar`,
    {}
  );*/

}



}





















