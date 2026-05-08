import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-rfq-quotation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rfq-quotation.html',
  styleUrl: './rfq-quotation.scss'
})
export class RfqQuotationComponent implements OnInit {

  provider: any = null;
  products: any[] = [];

  subtotal = 0;
  igv = 0;
  total = 0;

  fechaValidez = '';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {

    const data = localStorage.getItem('selected_provider');

    if (!data) {
      this.router.navigate(['/app/rfq/results']);
      return;
    }

    this.provider = JSON.parse(data);
    this.products = this.provider.items || [];

    this.calcularMontos();
    this.establecerFechaValidez();
  }

  calcularMontos(): void {

    const total = Number(this.provider.totalCotizacion);

    this.total = total;
    this.subtotal = Number((total / 1.18).toFixed(2));
    this.igv = Number((total - this.subtotal).toFixed(2));
  }

  establecerFechaValidez(): void {

    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 7);

    this.fechaValidez = fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  confirmarOrden(): void {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const body = {
      idProveedor: this.provider.idProveedor,
      subtotal: this.subtotal,
      igv: this.igv,
      total: this.total,
      direccionEnvio: 'Sede Central Cliente',
      items: this.products.map(p => ({
        idProducto: p.idProducto,
        cantidad: Number(p.cantidad),
        precioUnitario: Number(p.precioUnitario)
      }))
    };

    this.http.post(
      'http://localhost:8080/api/solicitudes/crear',
      body,
      { headers }
    ).subscribe({

      next: (res: any) => {

        localStorage.setItem('current_solicitud_id', String(res.idSolicitud));

        localStorage.setItem('selected_provider', JSON.stringify({
          ...this.provider,
          total: this.total
        }));

        this.router.navigate(['/app/rfq/payment']);
      },

      error: () => {
        alert('Error al crear solicitud');
      }
    });
  }
}