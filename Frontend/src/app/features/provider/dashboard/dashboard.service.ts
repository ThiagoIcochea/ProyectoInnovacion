

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { DashboardResponse } from './dashboard-response.model';


@Injectable({
  providedIn: 'root'
})
export class ProveedorDashboardService {

  private apiUrl =
    'http://localhost:8080';

  constructor(
    private http: HttpClient
  ) {}






getDashboard(): Observable<DashboardResponse> {
  return this.http.get<DashboardResponse>(
    `${this.apiUrl}/api/dashboard/proveedor`
  );
}




}
