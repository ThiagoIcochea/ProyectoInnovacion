import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rfq-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rfq-payment.html',
  styleUrl: './rfq-payment.scss'
})
export class RfqPaymentComponent implements OnInit {
  solicitudId: number = 0;
  provider: any = null;
  metodosPago: any[] = [];
  
  selectedMetodo: any = null;
  codigoOperacion: string = '';
  direccionEntrega: string = ''; 
  archivoCaptura: File | null = null;
  previewUrl: string | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const id = localStorage.getItem('current_solicitud_id');
    const provData = localStorage.getItem('selected_provider');

    if (!id || !provData) {
      this.router.navigate(['/app/rfq/catalog']);
      return;
    }

    this.solicitudId = Number(id);
    this.provider = JSON.parse(provData);
    this.cargarCuentasDelProveedor(this.provider.idProveedor);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  cargarCuentasDelProveedor(idProv: number) {
    this.http.get<any[]>(`http://localhost:8080/api/solicitudes/proveedor/${idProv}/metodos-pago`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (res) => {
          this.metodosPago = res;
        },
        error: (err) => console.error("Error cargando cuentas:", err)
      });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoCaptura = file;
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  confirmarPago() {
    if (!this.selectedMetodo || !this.codigoOperacion || !this.archivoCaptura || !this.direccionEntrega) {
      alert('Debe seleccionar cuenta, ingresar código, confirmar dirección y subir el voucher.');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', this.archivoCaptura);
    formData.append('entidad', this.selectedMetodo.entidad);
    formData.append('codigoOperacion', this.codigoOperacion);
    formData.append('monto', this.provider.totalCotizacion.toString());
    formData.append('metodo', this.selectedMetodo.tipo);
    formData.append('direccion', this.direccionEntrega); 

    this.http.post(`http://localhost:8080/api/solicitudes/${this.solicitudId}/pagar`, formData, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          alert('¡Pago registrado con éxito!');
          localStorage.removeItem('rfq_cart');
          localStorage.removeItem('current_solicitud_id');
          localStorage.removeItem('selected_provider');
          this.router.navigate(['/app/requests']);
        },
        error: (err) => {
          console.error(err);
          alert('Error al procesar el registro de pago.');
        }
      });
  }
}
