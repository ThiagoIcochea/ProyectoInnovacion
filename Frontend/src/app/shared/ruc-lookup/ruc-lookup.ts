import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, switchMap, timer } from 'rxjs';
import { APP_API_BASE_URL } from '../../core/constants/app.constants';

export interface EmpresaRuc { ruc: string; razonSocial: string; descripcion: string; }

@Component({
  selector: 'app-ruc-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <label for="empresa-ruc">RUC</label>
    <input id="empresa-ruc" type="text" inputmode="numeric" maxlength="11"
      [ngModel]="ruc" (ngModelChange)="cambiarRuc($event)" [ngModelOptions]="{standalone: true}"
      placeholder="Ingresa los 11 digitos" aria-describedby="ruc-status" />
    <div id="ruc-status" aria-live="polite">
      <p *ngIf="loading()">Consultando datos de la empresa...</p>
      <p *ngIf="error()">{{ error() }} <button type="button" (click)="consultar()">Reintentar</button></p>
    </div>
    <div *ngIf="empresa() as datos">
      <label>Razon social</label><p>{{ datos.razonSocial }}</p>
      <label>Descripcion fiscal</label><p>{{ datos.descripcion }}</p>
    </div>
    <small>La razon social y la descripcion fiscal se completan automaticamente con la consulta del RUC.</small>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    label { display: block; font-weight: 600; margin: 12px 0 6px; }
    input { box-sizing: border-box; width: 100%; padding: 12px; border-radius: 8px;
      border: 1px solid var(--theme-border, #94a3b8); background: var(--theme-surface, #fff); color: var(--theme-text, #172033); }
    p { margin: 8px 0; overflow-wrap: anywhere; }
    small { display: block; margin-top: 8px; }
    button { cursor: pointer; margin-left: 8px; }
  `]
})
export class RucLookupComponent implements OnChanges, OnDestroy {
  @Input() ruc = '';
  @Output() rucChange = new EventEmitter<string>();
  @Output() empresaChange = new EventEmitter<EmpresaRuc | null>();
  readonly loading = signal(false);
  readonly error = signal('');
  readonly empresa = signal<EmpresaRuc | null>(null);
  private request?: Subscription;
  constructor(private http: HttpClient) {}
  ngOnChanges(): void { this.consultar(); }
  ngOnDestroy(): void { this.request?.unsubscribe(); }
  cambiarRuc(value: string): void {
    this.ruc = value.replace(/\D/g, '').slice(0, 11);
    this.rucChange.emit(this.ruc);
    this.empresaChange.emit(null);
    this.consultar();
  }
  consultar(): void {
    this.request?.unsubscribe();
    this.empresa.set(null);
    this.loading.set(false);
    this.error.set('');
    const ruc = this.ruc;
    if (!/^(10|20)\d{9}$/.test(ruc)) {
      if (ruc) this.error.set('El RUC debe tener 11 digitos y empezar con 10 o 20.');
      return;
    }
    this.loading.set(true);
    this.request = timer(350).pipe(switchMap(() =>
      this.http.get<EmpresaRuc>(`${APP_API_BASE_URL}/auth/proveedor/ruc/${ruc}`)
    )).subscribe({
      next: datos => {
        this.loading.set(false);
        if (datos.ruc !== this.ruc || !datos.razonSocial) {
          this.error.set('La consulta no devolvio datos validos para este RUC.');
          this.empresaChange.emit(null);
          return;
        }
        this.empresa.set(datos);
        this.empresaChange.emit(datos);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo consultar el RUC. Verifica el numero y reintenta.');
        this.empresaChange.emit(null);
      }
    });
  }
}
