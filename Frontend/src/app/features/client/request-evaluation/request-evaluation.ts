import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-request-evaluation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-evaluation.html',
  styleUrl: './request-evaluation.scss'
})
export class RequestEvaluationComponent {
  rating = 0;

  constructor(private router: Router) {}

  setRating(value: number) {
    this.rating = value;
  }

  submitEvaluation() {
    alert('Evaluación enviada correctamente');
    this.router.navigate(['/app/history']);
  }
}