import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-rfqs',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  templateUrl: './rfqs.html',
  styleUrl: './rfqs.scss'
})
export class AdminRfqsComponent implements OnInit {

  rfqs: any[] = [];
  search: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.listarRfqs();
  }

  listarRfqs(): void {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any[]>(
      'https://proyectoinnovacion.onrender.com/api/solicitudes/admin/listar',
      { headers }
    ).subscribe({

      next: (data) => {
        this.rfqs = data;
      },

      error: (err) => {
        console.error(err);
      }

    });
  }

  filtrarRfqs(): any[] {

    if (!this.search) return this.rfqs;

    const s = this.search.toLowerCase();

    return this.rfqs.filter(rfq =>
      rfq.idSolicitud?.toString().includes(s) ||
      rfq.nombreCliente?.toLowerCase().includes(s) ||
      rfq.nombreProveedor?.toLowerCase().includes(s)
    );
  }

  formatearEstado(estado: string): string {

    switch (estado) {

      case 'PAGO_PENDIENTE':
        return 'Pago pendiente';

      case 'PAGO_VALIDANDO':
        return 'Validando pago';

      case 'PAGADA':
        return 'Pagada';

      case 'EN_CAMINO':
        return 'En camino';

      case 'ENTREGADA':
        return 'Entregada';

      case 'CANCELADA':
        return 'Cancelada';

      case 'COMPLETADA':
        return 'Completada';

      default:
        return estado;
    }
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE');
  }
}