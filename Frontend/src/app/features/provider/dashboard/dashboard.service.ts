




import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { DashboardResponse } from './dashboard-response.model';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class ProveedorDashboardService {

 

  constructor(
    private http: HttpClient
  ) {}






getDashboard(): Observable<DashboardResponse> {
  return this.http.get<DashboardResponse>(
    `${APP_API_BASE_URL}/dashboard/proveedor`
  );
}




}








