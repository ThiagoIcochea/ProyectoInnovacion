import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rfq-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rfq-payment.html',
  styleUrl: './rfq-payment.scss'
})
export class RfqPaymentComponent {
  selectedMethod: string = 'transfer';

  constructor(private router: Router) {}

  selectMethod(method: string) {
    this.selectedMethod = method;
  }

  confirmPayment() {
    // simulación
    alert('Pago registrado correctamente');
    this.router.navigate(['/app/requests']);
  }
}