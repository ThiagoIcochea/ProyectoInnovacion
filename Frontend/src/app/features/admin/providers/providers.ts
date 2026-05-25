import { CommonModule } from '@angular/common';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';

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
    'https://proyectoinnovacion.onrender.com/api/provider/admin/listar';

  providers: any[] = [];

  filteredProviders: any[] = [];

  searchTerm: string = '';

  loading: boolean = false;

  constructor(
    private http: HttpClient,
    private zone: NgZone,
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

        this.zone.run(() => {

          this.providers =
            [...(res || [])];

          this.filteredProviders =
            [...this.providers];

          this.loading = false;

          this.cdr.detectChanges();

        });

      },

      error: (err) => {

        console.error(err);

        this.loading = false;

        this.cdr.detectChanges();

      }
    });
  }

  filtrarProviders(): void {

    const texto =
      this.searchTerm
      .toLowerCase()
      .trim();

    if (!texto) {

      this.filteredProviders =
        [...this.providers];

      this.cdr.detectChanges();

      return;
    }

    this.filteredProviders =
      this.providers.filter(p =>

        p?.razonSocial
          ?.toLowerCase()
          .includes(texto)

        ||

        p?.correo
          ?.toLowerCase()
          .includes(texto)

        ||

        p?.estado
          ?.toLowerCase()
          .includes(texto)

        ||

        p?.ruc
          ?.toLowerCase()
          .includes(texto)

      );

    this.cdr.detectChanges();
  }

  getTotalProveedores(): number {

    return this.filteredProviders.length;
  }

  getActivos(): number {

    return this.filteredProviders.filter(

      p =>

        p?.estado?.toUpperCase()
        === 'ACTIVO'

    ).length;
  }

  getApiConectada(): number {

    return this.filteredProviders.filter(

      p =>

        p?.apiUrl &&
        p?.apiUrl.trim() !== ''

    ).length;
  }

  getSuspendidos(): number {

    return this.filteredProviders.filter(

      p =>

        p?.estado?.toUpperCase()
        === 'SUSPENDIDO'

    ).length;
  }
}