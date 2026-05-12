import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rfq-quotation',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
  loading = false;

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

    this.total = Number(this.provider.totalCotizacion);
    this.subtotal = Number((this.total / 1.18).toFixed(2));
    this.igv = Number((this.total - this.subtotal).toFixed(2));

    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 7);

    this.fechaValidez = fecha.toLocaleDateString('es-PE');
  }

  confirmarOrden(): void {

    if (this.loading) return;

    if (!this.rucEmpresa || this.rucEmpresa.length !== 11) {
      alert('Ingrese un RUC válido');
      return;
    }

    this.loading = true;

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const empresaBody = {
      ruc: this.rucEmpresa
    };

    this.http.post<any>(
      'https://proyectoinnovacion.onrender.com/api/empresas',
      empresaBody,
      { headers }
    ).subscribe({

      next: (empresa) => {

        const solicitudBody = {
          idEmpresa: empresa.idEmpresa,
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

        this.http.post<any>(
          'https://proyectoinnovacion.onrender.com/api/solicitudes/crear',
          solicitudBody,
          { headers }
        ).subscribe({

          next: (res) => {

            localStorage.setItem(
              'current_solicitud_id',
              String(res.idSolicitud)
            );

            localStorage.removeItem('rfq_cart');
            localStorage.removeItem('selected_provider');

            this.loading = false;

            this.router.navigate(['/app/rfq/payment']);
          },

          error: () => {
            this.loading = false;
            alert('Error al crear solicitud');
          }
        });
      },

      error: () => {
        this.loading = false;
        alert('Error al registrar empresa');
      }
    });
  }
}