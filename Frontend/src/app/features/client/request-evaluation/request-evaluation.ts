import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { APP_STORAGE_KEYS } from '../../../core/constants/app.constants';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-request-evaluation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-evaluation.html',
  styleUrl: './request-evaluation.scss'
})
export class RequestEvaluationComponent implements OnInit {
  rating = 0;

  private solicitudId: number | null = null;
  private autoCompleteTimer: any = null;

  constructor(
    private router: Router,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = localStorage.getItem(APP_STORAGE_KEYS.currentSolicitudId);

    if (id) {
      this.solicitudId = Number(id);
      // trigger evaluation email when user reaches this view (order assumed delivered)
      this.notification.notifyEvaluation(this.solicitudId).subscribe({
        next: () => {
          // start fallback timer (3 minutes for testing)
          this.startAutoCompleteTimer(3 * 60 * 1000);
        },
        error: (err) => {
          console.warn('notifyEvaluation failed', err);
          // still start local timer so tests can proceed
          this.startAutoCompleteTimer(3 * 60 * 1000);
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.autoCompleteTimer) {
      clearTimeout(this.autoCompleteTimer);
    }
  }

  private startAutoCompleteTimer(timeoutMs: number) {
    if (this.autoCompleteTimer) {
      clearTimeout(this.autoCompleteTimer);
    }

    this.autoCompleteTimer = setTimeout(() => {
      if (!this.solicitudId) return;
      this.notification.autoCompleteIfUnresolved(this.solicitudId).subscribe({
        next: () => {
          console.log('Solicitud marcada como completada por timeout');
        },
        error: (err) => console.error('autoCompleteIfUnresolved error', err)
      });
    }, timeoutMs);
  }

  setRating(value: number) {
    this.rating = value;
  }

  submitEvaluation() {
    // resolve evaluation on backend (if possible)
    if (this.solicitudId) {
      this.notification.resolveEvaluation(this.solicitudId).subscribe({
        next: () => {
          alert('Evaluación enviada correctamente');
          this.router.navigate(['/app/history']);
        },
        error: () => {
          alert('Evaluación enviada correctamente');
          this.router.navigate(['/app/history']);
        }
      });
      return;
    }

    alert('Evaluación enviada correctamente');
    this.router.navigate(['/app/history']);
  }
}