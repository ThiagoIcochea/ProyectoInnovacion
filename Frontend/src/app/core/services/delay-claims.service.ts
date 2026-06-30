import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  APP_API_BASE_URL,
  APP_STORAGE_KEYS
} from '../constants/app.constants';
import { Observable } from 'rxjs';

export interface DelayClaim {
  id?: string;
  idSolicitud: number;
  idProveedor?: number | null;
  proveedor: string;
  empresaCliente: string;
  orderCode: string;
  motivo: 'DEMORA';
  descripcion: string;
  fechaPrometida: string;
  diasDemora: number;
  estado?: 'PENDIENTE_PROVEEDOR' | 'RESPONDIDO' | 'CERRADO';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DelayClaimsService {

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  save(
    claim: Omit<DelayClaim, 'id' | 'createdAt' | 'updatedAt' | 'estado'>
  ): Observable<any> {

    return this.http.post(
      `${APP_API_BASE_URL}/reclamos/demora`,
      {
        idSolicitud: claim.idSolicitud,
        descripcion: claim.descripcion,
        tipo: claim.motivo
      },
      {
        headers: this.headers()
      }
    );

  }

}