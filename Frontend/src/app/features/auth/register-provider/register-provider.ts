import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register-provider',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './register-provider.html',
  styleUrl: './register-provider.scss'
})
export class RegisterProviderComponent implements OnInit {

  nombres = '';
  apellidos = '';
  correo = '';
  password = '';
  telefono = '';
  whatsapp = '';
  direccion = '';

  razonSocial = '';
  ruc = '';
  descripcion = '';

  apiUrl = '';
  apiTipo = 'REST';
  apiToken = '';

  private baseUrl = 'https://proyectoinnovacion.onrender.com/api/provider';

  constructor(private http: HttpClient) {}

  headers() {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }

  /* ================= METODOS DE PAGO ================= */

  metodosPago: any[] = [];
  showPagoModal = false;

  tipoPago = '';
  entidadPago = '';
  numeroCuenta = '';

  openPagoModal() {
    this.showPagoModal = true;
  }

  closePagoModal() {
    this.showPagoModal = false;
  }

  addMetodoPago() {

    if (!this.tipoPago || !this.entidadPago || !this.numeroCuenta) {
      alert('Completa todos los campos');
      return;
    }

    this.metodosPago.push({
      tipo: this.tipoPago,
      entidad: this.entidadPago,
      numeroCuenta: this.numeroCuenta
    });

    this.tipoPago = '';
    this.entidadPago = '';
    this.numeroCuenta = '';
    this.showPagoModal = false;
  }

  /* ================= CERTIFICACIONES ================= */

  certificaciones: any[] = [];
  selectedCerts: any = {};

  fechaObtencionMap: any = {};
  fechaExpiracionMap: any = {};

  ngOnInit(): void {
    this.http.get<any>('https://proyectoinnovacion.onrender.com/api/certificaciones')
      .subscribe(res => this.certificaciones = res);
  }

  toggleCertificacion(event: any, id: number) {

    if (event.target.checked) {
      this.selectedCerts[id] = true;
    } else {
      delete this.selectedCerts[id];
      delete this.fechaObtencionMap[id];
      delete this.fechaExpiracionMap[id];
    }
  }

  register() {

    if (this.metodosPago.length < 1) {
      alert('Debes agregar al menos 1 método de pago');
      return;
    }

    const certificacionesPayload = Object.keys(this.selectedCerts).map(id => ({
      idCertificacion: Number(id),
      fechaObtencion: this.fechaObtencionMap[id],
      fechaExpiracion: this.fechaExpiracionMap[id]
    }));

    const payload = {
      nombres: this.nombres,
      apellidos: this.apellidos,
      correo: this.correo,
      password: this.password,
      telefono: this.telefono,
      whatsapp: this.whatsapp,
      direccion: this.direccion,

      razonSocial: this.razonSocial,
      ruc: this.ruc,
      descripcion: this.descripcion,

      apiUrl: this.apiUrl,
      apiTipo: this.apiTipo,
      apiToken: this.apiToken,

      metodosPago: this.metodosPago,
      certificaciones: certificacionesPayload
    };

    this.http.post(
      `${this.baseUrl}/register`,
      payload,
      { headers: this.headers() }
    ).subscribe({
      next: () => alert('Proveedor registrado correctamente'),
      error: err => console.error(err)
    });
  }
}