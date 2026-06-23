import { CommonModule } from '@angular/common';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { APP_API_BASE_URL } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-admin-providers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './providers.html',
  styleUrl: './providers.scss'
})
export class AdminProvidersComponent
implements OnInit {

  private API_URL =
    `${APP_API_BASE_URL}/provider/admin/listar`;

  providers: any[] = [];

  filteredProviders: any[] = [];

  searchTerm: string = '';
  loading = true;
  readonly skeletonRows = Array.from({ length: 5 });

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.listarProviders();

   
  }

  private headers(): HttpHeaders {

    return new HttpHeaders({

      Authorization:
        `Bearer ${localStorage.getItem('token')}`

    });
  }

  listarProviders(): void {
    this.loading = true;

    this.http.get<any[]>(
      this.API_URL,
      {
        headers: this.headers()
      }
    )
    .subscribe({

      next: (res) => {

        this.providers = res;

        this.filteredProviders = [...res];

        this.filtrarProviders();
        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error(err);
        this.providers = [];
        this.filteredProviders = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filtrarProviders(): void {

    const text =
      this.searchTerm.toLowerCase();

    this.filteredProviders =
      this.providers.filter(provider =>

        provider?.razonSocial
          ?.toLowerCase()
          .includes(text)

        ||

        provider?.correo
          ?.toLowerCase()
          .includes(text)

        ||

        provider?.estado
          ?.toLowerCase()
          .includes(text)

        ||

        provider?.estadoApi
          ?.toLowerCase()
          .includes(text)

        ||

        provider?.ruc
          ?.toLowerCase()
          .includes(text)
      );

    this.cdr.detectChanges();
  }

  getTotalProveedores(): number {

    return this.filteredProviders.length;
  }

  getActivos(): number {

    return this.filteredProviders.filter(
      p =>
        p.estado?.toUpperCase() === 'ACTIVO'
    ).length;
  }

  getApiConectada(): number {

    return this.filteredProviders.filter(
      p =>
        p.estadoApi?.toUpperCase() === 'OK'
    ).length;
  }

  getSuspendidos(): number {

    return this.filteredProviders.filter(
      p =>
        p.estado?.toUpperCase() === 'SUSPENDIDO'
    ).length;
  }
}
