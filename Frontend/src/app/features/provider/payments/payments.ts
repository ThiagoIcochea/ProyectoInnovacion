

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PagoService } from './provider-payment.service';
import { Payment } from './payments.model';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';


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

  accionModal: 'APROBAR' | 'RECHAZAR' | null = null;
  mostrarModal = false;

  constructor(private pagoService: PagoService) {}

ngOnInit(): void {

  

  const token = localStorage.getItem('token');

  console.log("TOKEN JWT:", token);

    this.payments$ = this.pagoService.listarMisPagos();

  }




seleccionarPago(pago: Payment): void {
    this.selectedPayment = pago;

     console.log("seleccionpago", this.selectedPayment); 

    
  }



abrirModal(accion: 'APROBAR' | 'RECHAZAR'): void {
  if (!this.selectedPayment) return;

  this.accionModal = accion;
  this.mostrarModal = true;
}




cerrarModal(): void {

  this.mostrarModal = false;
  this.accionModal=null; 


}




confirmarAccion(): void {
  if (!this.selectedPayment) return;

  const idPago = this.selectedPayment.idPago;

  if (this.accionModal === 'APROBAR') {
    this.aprobarPago(idPago);
  }

  if (this.accionModal === 'RECHAZAR') {
    this.rechazarPago(idPago);
  }
}




aprobarPago(idPago:number): void {

    //if (!this.selectedPayment) return;

    //const idPago = this.selectedPayment?.idPago;

  //if (!idPago) {
   // console.error("idPago no válido");
   //return;
  //}

    this.pagoService
      .aprobarPago(idPago)
      .subscribe({

        next: (resp) => {
           console.log(resp.mensaje); 
          //alert('Pago aprobado correctamente');



            this.cerrarModal(); 
          // recargar lista
          //this.payments$ =
          //  this.pagoService.listarMisPagos()

           // .pipe(

            //  tap((pagos) => {

            //    this.selectedPayment =
             //     pagos.length > 0
             //       ? pagos[0]
             //       : null;

             // })

            //);  


        },

        error: (err) => {

          console.error(err);
          console.log("error al aprobar"); 

          //this.mostrarModal=false; 

          //alert('Error al aprobar pago');

        }

      });

  }


rechazarPago(idPago:number): void {

    //if (!this.selectedPayment) return;

   // const idPago = this.selectedPayment?.idPago;

  //if (!idPago) {
  //  console.error("idPago no válido");
  //  return;
  //}

    this.pagoService
      .rechazarPago(idPago)
      .subscribe({

        next: (resp) => {
           console.log(resp.mensaje); 
          //alert('Pago no aprobado');

            this.recargarPagos(); 
            this.cerrarModal(); 
          // recargar lista
          //this.payments$ =
          //  this.pagoService.listarMisPagos()

           // .pipe(

            //  tap((pagos) => {

            //    this.selectedPayment =
            //      pagos.length > 0
            //        ? pagos[0]
            //        : null;

            //  })

           // );  


        },

        error: (err) => {

          console.error(err);
          console.log("error al rechazar"); 

          //this.mostrarModal=false; 

          //alert('Error al rechazar pago');

        }

      });

  }



private recargarPagos(): void {
  this.payments$ = this.pagoService.listarMisPagos().pipe(
    tap((pagos) => {
      this.selectedPayment = pagos.length > 0 ? pagos[0] : null;
    })
  );
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


  



























