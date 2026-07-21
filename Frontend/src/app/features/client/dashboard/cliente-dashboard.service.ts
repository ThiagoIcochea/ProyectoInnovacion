


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { ClienteDashboardResponse } from './cliente-dashboard-response.model';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';

@Injectable({
  providedIn: 'root'
  
})
export class ClienteDashboardService {

 

  constructor(
    private http: HttpClient
  ) {}






obtenerDashboard(): Observable<ClienteDashboardResponse> {
  return this.http.get<ClienteDashboardResponse>(
    `${APP_API_BASE_URL}/dashboard/cliente`
  );
}



}










