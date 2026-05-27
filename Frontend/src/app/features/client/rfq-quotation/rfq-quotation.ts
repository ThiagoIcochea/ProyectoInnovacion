// Backend touchpoint: quotation confirmation, company lookup and order creation.

import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { FormsModule } from '@angular/forms';

import * as L from 'leaflet';

import {
  APP_API_BASE_URL,
  APP_ROUTE_PATHS,
  APP_STORAGE_KEYS
} from '../../../core/constants/app.constants';

@Component({
  selector: 'app-rfq-quotation',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './rfq-quotation.html',
  styleUrl: './rfq-quotation.scss'
})
export class RfqQuotationComponent implements OnInit {

  provider: any;

  products: any[] = [];

  subtotal = 0;
  igv = 0;
  total = 0;

  fechaValidez = '';

  rucEmpresa = '';

  direccionEntrega = '';

  loading = false;

  // MAPA MODAL
  mostrarMapaModal = false;

  map: any;

  marker: any;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {

    const data =
      localStorage.getItem(
        APP_STORAGE_KEYS.selectedProvider
      );

    if (!data) {

      this.router.navigate([
        APP_ROUTE_PATHS.rfqResults
      ]);

      return;
    }

    this.provider = JSON.parse(data);

    this.products =
      this.provider.items ??
      this.provider.itemsDetalle ??
      this.provider.productos ??
      [];

    this.total =
      Number(
        this.provider.totalCotizacion || 0
      );

    this.subtotal =
      Number(
        (this.total / 1.18).toFixed(2)
      );

    this.igv =
      Number(
        (this.total - this.subtotal).toFixed(2)
      );

    const fecha = new Date();

    fecha.setDate(
      fecha.getDate() + 7
    );

    this.fechaValidez =
      fecha.toLocaleDateString('es-PE');
  }

  abrirMapaModal(): void {

    this.mostrarMapaModal = true;

    setTimeout(() => {

      this.initMap();

    }, 200);
  }

  cerrarMapaModal(): void {

    this.mostrarMapaModal = false;

    if (this.map) {

      this.map.remove();

      this.map = null;
    }
  }

  initMap(): void {

    if (this.map) {

      this.map.remove();
    }

    this.map =
      L.map('quotationMap', {
        zoomControl: true
      });

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '© OpenStreetMap'
      }
    ).addTo(this.map);

    if (navigator.geolocation) {

      navigator.geolocation.getCurrentPosition(

        (pos) => {

          const lat =
            pos.coords.latitude;

          const lng =
            pos.coords.longitude;

          this.map.setView(
            [lat, lng],
            16
          );

          this.marker =
            L.marker([lat, lng])
            .addTo(this.map);

          this.obtenerDireccion(
            lat,
            lng
          );

          setTimeout(() => {

            this.map.invalidateSize();

          }, 300);
        },

        () => {

          this.map.setView(
            [-12.0464, -77.0428],
            13
          );
        }
      );

    } else {

      this.map.setView(
        [-12.0464, -77.0428],
        13
      );
    }

    // CLICK EN MAPA
    this.map.on(
      'click',
      (e: any) => {

        const lat =
          e.latlng.lat;

        const lng =
          e.latlng.lng;

        if (this.marker) {

          this.map.removeLayer(
            this.marker
          );
        }

        this.marker =
          L.marker([lat, lng])
          .addTo(this.map);

        this.obtenerDireccion(
          lat,
          lng
        );

        // CERRAR AUTOMATICAMENTE
        setTimeout(() => {

          this.cerrarMapaModal();

        }, 700);
      }
    );

    setTimeout(() => {

      this.map.invalidateSize();

    }, 100);
  }

  obtenerDireccion(
    lat: number,
    lng: number
  ): void {

    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

    this.http.get<any>(url)
    .subscribe(res => {

      if (!res || !res.address) {

        this.direccionEntrega =
          res.display_name ||
          'Ubicación no encontrada';

        return;
      }

      const a = res.address;

      const calle =
        a.road ||
        a.pedestrian ||
        a.footway ||
        a.street ||
        '';

      const numero =
        a.house_number
          ? ` ${a.house_number}`
          : '';

      const distrito =
        a.suburb ||
        a.city_district ||
        a.city ||
        '';

      const provincia =
        a.county || '';

      const departamento =
        a.state || '';

      this.direccionEntrega =
        `${calle}${numero}, ${distrito}, ${provincia}, ${departamento}`.trim();

      if (
        !calle &&
        !distrito &&
        !provincia &&
        !departamento
      ) {

        this.direccionEntrega =
          res.display_name;
      }
    });
  }

  confirmarOrden(): void {

    if (this.loading) return;

    if (
      !this.rucEmpresa ||
      this.rucEmpresa.length !== 11
    ) {

      alert(
        'Ingrese un RUC válido'
      );

      return;
    }

    if (!this.direccionEntrega) {

      alert(
        'Seleccione una dirección'
      );

      return;
    }

    this.loading = true;

    const token =
      localStorage.getItem(
        APP_STORAGE_KEYS.token
      );

    const headers =
      new HttpHeaders({
        Authorization:
          `Bearer ${token}`
      });

    this.http.post<any>(
      `${APP_API_BASE_URL}/empresas`,
      {
        ruc: this.rucEmpresa
      },
      { headers }
    ).subscribe({

      next: (empresa) => {

        const solicitudBody = {

          idEmpresa:
            empresa.idEmpresa,

          idProveedor:
            this.provider.idProveedor,

          subtotal:
            this.subtotal,

          igv:
            this.igv,

          total:
            this.total,

          direccionEnvio:
            this.direccionEntrega,

          items:
            this.products.map(p => ({

              idProducto:
                p.idProducto,

              cantidad:
                Number(p.cantidad),

              precioUnitario:
                Number(p.precioUnitario)

            }))
        };

        this.http.post(
          `${APP_API_BASE_URL}/solicitudes/crear`,
          solicitudBody,
          { headers }
        ).subscribe({

          next: (res: any) => {

            localStorage.setItem(
              APP_STORAGE_KEYS.currentSolicitudId,
              String(res.idSolicitud)
            );

            localStorage.removeItem(
              APP_STORAGE_KEYS.rfqCart
            );

            localStorage.removeItem(
              APP_STORAGE_KEYS.selectedProvider
            );

            this.loading = false;

            this.router.navigate([
              APP_ROUTE_PATHS.clientRequests
            ]);
          },

          error: () => {

            this.loading = false;

            alert(
              'Error al crear solicitud'
            );
          }
        });
      },

      error: () => {

        this.loading = false;

        alert(
          'Error al registrar empresa'
        );
      }
    });
  }
}