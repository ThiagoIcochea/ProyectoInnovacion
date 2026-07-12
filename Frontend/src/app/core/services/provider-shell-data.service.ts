import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, shareReplay } from 'rxjs';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class ProviderShellDataService {
  private providerApi$?: Observable<any>;
  private providerRequests$?: Observable<any[]>;
  private providerPayments$?: Observable<any[]>;
  private providerDeliveries$?: Observable<any[]>;
  private providerClaims$?: Observable<any[]>;

  constructor(private http: HttpClient) {}

  getProviderApi(refresh = false): Observable<any> {
    if (refresh || !this.providerApi$) {
      this.providerApi$ = this.http.get<any>(
        `${APP_API_BASE_URL}/proveedor-api`,
        { headers: this.headers() }
      ).pipe(
        catchError(() => of(null)),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.providerApi$;
  }

  getProviderRequests(refresh = false): Observable<any[]> {
    if (refresh || !this.providerRequests$) {
      this.providerRequests$ = this.http.get<any[]>(
        `${APP_API_BASE_URL}/solicitudes/proveedor/mis-solicitudes`,
        { headers: this.headers() }
      ).pipe(
        catchError(() => of([])),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.providerRequests$;
  }

  getProviderPayments(refresh = false): Observable<any[]> {
    if (refresh || !this.providerPayments$) {
      this.providerPayments$ = this.http.get<any[]>(
        `${APP_API_BASE_URL}/pagos/proveedor/mis-pagos`,
        { headers: this.headers() }
      ).pipe(
        catchError(() => of([])),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.providerPayments$;
  }

  getProviderDeliveries(refresh = false): Observable<any[]> {
    if (refresh || !this.providerDeliveries$) {
      this.providerDeliveries$ = this.http.get<any[]>(
        `${APP_API_BASE_URL}/solicitudes/proveedor/entregas`,
        { headers: this.headers() }
      ).pipe(
        catchError(() => of([])),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.providerDeliveries$;
  }

  getProviderClaims(refresh = false): Observable<any[]> {
    if (refresh || !this.providerClaims$) {
      this.providerClaims$ = this.http.get<any[]>(
        `${APP_API_BASE_URL}/reclamos/proveedor/mis-reclamos`,
        { headers: this.headers() }
      ).pipe(
        catchError(() => of([])),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.providerClaims$;
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }
}
