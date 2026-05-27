// Backend touchpoint: payment flow loads tracking data, payment methods and confirms payment.
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { APP_API_BASE_URL, APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../../../core/constants/app.constants';

@Component({
  selector: 'app-rfq-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rfq-payment.html',
  styleUrl: './rfq-payment.scss'
})
export class RfqPaymentComponent implements OnInit, AfterViewInit {

  solicitudId!: number;
  provider: any = null;
  metodosPago: any[] = [];
  procesandoPago = false;

  selectedMetodo: any = null;
  codigoOperacion = '';
  direccionEntrega = '';
  archivoCaptura: File | null = null;
  previewUrl: string | null = null;
  nombreArchivoCaptura = '';

  totalSolicitud = 0;

  map: any;
  marker: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    const id = localStorage.getItem(APP_STORAGE_KEYS.currentSolicitudId);

    if (!id) {
      this.router.navigate([APP_ROUTE_PATHS.clientRequests]);
      return;
    }

    this.solicitudId = Number(id);
    this.cargarSolicitud();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 300);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.map) {
      return;
    }

    setTimeout(() => this.map.invalidateSize(), 120);
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  cargarSolicitud(): void {

    this.http.get<any>(
      `${APP_API_BASE_URL}/solicitudes/${this.solicitudId}/tracking`,
      { headers: this.headers() }
    ).subscribe(res => {

      console.log('TRACKING TOTAL:', res.total);
console.log('RFQ TOTAL:', this.provider?.totalCotizacion);

      this.provider = {
        nombreProveedor: res.proveedor,
        idProveedor: res.idProveedor
      };

      this.totalSolicitud = res.total;
      this.direccionEntrega = res.direccion;

      this.cargarMetodosPago(res.idProveedor);
    });
  }

  cargarMetodosPago(id: number): void {

    this.http.get<any[]>(
      `${APP_API_BASE_URL}/solicitudes/proveedor/${id}/metodos-pago`,
      { headers: this.headers() }
    ).subscribe(res => this.metodosPago = res);
  }

  initMap(): void {

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('map');

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    if (navigator.geolocation) {

      navigator.geolocation.getCurrentPosition(
        (pos) => {

          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          this.map.setView([lat, lng], 16);

          this.marker = L.marker([lat, lng]).addTo(this.map);

          this.obtenerDireccion(lat, lng);
          this.map.invalidateSize();
        },

        () => {

          this.map.setView([-12.0464, -77.0428], 13);
        }
      );

    } else {

      this.map.setView([-12.0464, -77.0428], 13);
    }

    this.map.on('click', (e: any) => {

      const { lat, lng } = e.latlng;

      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      this.marker = L.marker([lat, lng]).addTo(this.map);

      this.obtenerDireccion(lat, lng);
    });

    setTimeout(() => this.map.invalidateSize(), 0);
  }

  obtenerDireccion(lat: number, lng: number): void {

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

    this.http.get<any>(url).subscribe(res => {

      if (!res || !res.address) {
        this.direccionEntrega = res.display_name || 'Ubicación no encontrada';
        return;
      }

      const a = res.address;

      const calle =
        a.road ||
        a.pedestrian ||
        a.footway ||
        a.street ||
        '';

      const numero = a.house_number ? ` ${a.house_number}` : '';
      const distrito = a.suburb || a.city_district || a.city || '';
      const provincia = a.county || '';
      const departamento = a.state || '';

      this.direccionEntrega =
        `${calle}${numero}, ${distrito}, ${provincia}, ${departamento}`.trim();

      if (!calle && !distrito && !provincia && !departamento) {
        this.direccionEntrega = res.display_name;
      }
    });
  }

  onFileSelected(e: any): void {

    this.archivoCaptura = e.target.files[0];
    this.previewUrl = null;
    this.nombreArchivoCaptura = this.archivoCaptura?.name || '';

    if (!this.archivoCaptura) {
      this.cdr.detectChanges();
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      this.previewUrl = reader.result as string;
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(this.archivoCaptura);
  }

   confirmarPago(): void {

  if (this.procesandoPago) return;

  this.procesandoPago = true;

  const formData = new FormData();

  formData.append('archivo', this.archivoCaptura!);
  formData.append('codigoOperacion', this.codigoOperacion);
  formData.append('entidad', this.selectedMetodo.entidad);
  formData.append('metodo', this.selectedMetodo.tipo);
  formData.append('direccion', this.direccionEntrega);
  formData.append('monto', String(this.totalSolicitud));

  this.http.post(
    `${APP_API_BASE_URL}/solicitudes/${this.solicitudId}/pagar`,
    formData,
    { headers: this.headers() }
  ).subscribe({

    next: () => {
      this.procesandoPago = false;
      this.router.navigate([APP_ROUTE_PATHS.clientRequests]);
    },

    error: (err) => {
      this.procesandoPago = false;
      console.error(err);
      alert('Error al registrar pago');
    }
  });
}
}
