


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { HttpHeaders } from '@angular/common/http';
import { APP_STORAGE_KEYS } from '../../../core/constants/app.constants'; 



@Injectable({
  providedIn: 'root'
})
export class ProviderRequestsService {




  private apiUrl =
    'https://proyectoinnovacion.onrender.com';



constructor(private http: HttpClient) {}




private getHeaders() {
  return new HttpHeaders({
    Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
  });
}











  listarSolicitudes(): Observable<any[]> {

console.log("TOKEN:", localStorage.getItem('token'));


    return this.http.get<any[]>(
      `${this.apiUrl}/api/solicitudes/proveedor/mis-solicitudes`,
       {
        headers:this.getHeaders()  
       }


    );
  }


  aprobarPedido(idSolicitud:number){

  return this.http.put(
    `${this.apiUrl}/api/solicitudes/${idSolicitud}/aprobar`,
    {}
  );

}

}









