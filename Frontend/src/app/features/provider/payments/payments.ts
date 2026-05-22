

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PagoService } from './provider-payment.service';
import { Payment } from './payments.model';

import { Observable } from 'rxjs';



@Component({
  selector: 'app-provider-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payments.html',
  styleUrls: ['./payments.scss']
})


export class ProviderPaymentsComponent  implements OnInit    {

 
payments$!: Observable<Payment[]>;

  selectedPayment: Payment | null = null;

  constructor(private pagoService: PagoService) {}

ngOnInit(): void {

    this.payments$ = this.pagoService.listarMisPagos();

  }




seleccionarPago(pago: Payment): void {
    this.selectedPayment = pago;
  }




aprobarPago(): void {

    if (!this.selectedPayment) return;

    this.pagoService
      .aprobarPago(this.selectedPayment.idPago)
      .subscribe({

        next: () => {

          alert('Pago aprobado correctamente');

          // recargar lista
          this.payments$ =
            this.pagoService.listarMisPagos();

        },

        error: (err) => {

          console.error(err);

          alert('Error al aprobar pago');

        }

      });

  }










getFecha(date?: string) {
  if (!date){
   return ""; 
 }
  return new Date(date).toLocaleDateString('es-PE');
}



getHora(date: string) {
  if (!date){
   return ""; 

 }

  return new Date(date).toLocaleTimeString('es-PE');
}




getPagoCode(payment: any): string {
  if (!payment) return '';

  const year = new Date(payment.fechaPago).getFullYear();

  const id = String(payment.idPago).padStart(4, '0');

  return `PAG-${year}-${id}`;
}

getCotCode(payment: any): string {
  if (!payment) return '';

  const year = new Date(payment.fechaSolicitud).getFullYear();

  const id = String(payment.idSolicitud).padStart(4, '0');

  return `COT-${year}-${id}`;
}


getFechaCompleta(date?: string): string    {

 if (!date){
   return ""; 
 }

  const fecha = new Date(date);


  const fechaTexto = fecha.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long'
  });

  const horaTexto = fecha.toLocaleTimeString('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${fechaTexto} a las ${horaTexto}`;
}



/* estado 

payments:Payment[]=[]; 

selectedPayment:Payment | null =null; 


constructor(private pagoService:PagoService, private zone:NgZone){
  console.log("constructor", Math.random())
   
}



ngOnInit():void{
  console.log("entrando al componente")
  this.cargarPagos(); 
}

*/



/*cargarPagos(): void { */

    



















   
/*
  console.log('🔥 LLAMANDO PAGOS');

  this.pagoService.listarMisPagos()
    .subscribe({
      next: (res) => {

        console.log('✅ RESPUESTA PAGOS:', res);

        this.zone.run(() => {
           console.log('RAW RESPONSE:', res);
  console.log('IS ARRAY:', Array.isArray(res));
          const data = res || [];

  this.payments = [...data].map(p => ({ ...p }));

          this.selectedPayment = this.payments.length
            ? this.payments[0]
            : null;
        });

        console.log('📦 PAYMENTS EN COMPONENTE:', this.payments);
      },

      error: (err) => {
        console.error('❌ ERROR PAGOS:', err);
      }
    });

    */
    







          /*this.payments = res ? [...res]:[];

          if (this.payments.length > 0) {
            this.selectedPayment = this.payments[0];
          }


            console.log('Pagos:', this.payments);
        },

        error: (err) => {
          console.error('Error al cargar pagos', err);
        }
      }); */
  }


  



























