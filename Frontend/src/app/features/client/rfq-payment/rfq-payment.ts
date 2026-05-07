import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

@Component({
  selector: 'app-rfq-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rfq-payment.html',
  styleUrl: './rfq-payment.scss'
})
export class RfqPaymentComponent implements OnInit, AfterViewInit {

  solicitudId: number = 0;
  provider: any = null;
  metodosPago: any[] = [];
  selectedMetodo: any = null;
  codigoOperacion: string = '';
  direccionEntrega: string = '';
  archivoCaptura: File | null = null;
  previewUrl: string | null = null;
  totalSolicitud: number = 0;
  fechaEntregaEstimada: string = '';

  map: any;
  marker: any;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {

    const id = localStorage.getItem('current_solicitud_id');
    const provData = localStorage.getItem('selected_provider');

    if (!id || !provData) {
      this.router.navigate(['/app/rfq/catalog']);
      return;
    }

    this.solicitudId = Number(id);
    this.provider = JSON.parse(provData);
    this.totalSolicitud = Number(this.provider.total);

    this.cargarCuentasDelProveedor(this.provider.idProveedor);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 200);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  initMap(): void {

    this.map = L.map('map').setView([-12.0464, -77.0428], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.map.on('click', async (e: any) => {

      const { lat, lng } = e.latlng;

      if (this.marker) {
        this.map.removeLayer(this.marker);
      }

      this.marker = L.marker([lat, lng]).addTo(this.map);

      this.direccionEntrega = 'Buscando dirección...';

      const res: any = await this.http.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      ).toPromise();

      const addr = res.address;

      const calle = addr.road || addr.pedestrian || '';
      const numero = addr.house_number || '';
      const distrito = addr.suburb || addr.city || '';

      this.direccionEntrega = `${calle} ${numero}, ${distrito}`.trim();
    });
  }

  onFileSelected(event: any): void {

    const file = event.target.files[0];

    if (file) {
      this.archivoCaptura = file;

      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  confirmarPago(): void {

    if (!this.selectedMetodo || !this.codigoOperacion || !this.archivoCaptura || !this.direccionEntrega) {
      alert('Complete todos los datos');
      return;
    }

    const formData = new FormData();

    formData.append('archivo', this.archivoCaptura);
    formData.append('entidad', this.selectedMetodo.entidad);
    formData.append('codigoOperacion', this.codigoOperacion);
    formData.append('monto', this.totalSolicitud.toString());
    formData.append('metodo', this.selectedMetodo.tipo);
    formData.append('direccion', this.direccionEntrega);

    this.http.post(
      `http://localhost:8080/api/solicitudes/${this.solicitudId}/pagar`,
      formData,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => {
        alert('Pago registrado correctamente');
        this.router.navigate(['/app/requests']);
      },
      error: () => alert('Error en pago')
    });
  }

  cargarCuentasDelProveedor(idProv: number): void {

    this.http.get<any[]>(
      `http://localhost:8080/api/solicitudes/proveedor/${idProv}/metodos-pago`,
      { headers: this.getAuthHeaders() }
    ).subscribe(res => this.metodosPago = res);
  }
}