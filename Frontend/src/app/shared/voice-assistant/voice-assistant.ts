import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../core/constants/app.constants';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

@Component({
  selector: 'app-voice-assistant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-assistant.html',
  styleUrl: './voice-assistant.scss'
})
export class VoiceAssistantComponent {

  listening = false;
  thinking = false;
  transcript = '';
  answer = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  toggle(): void {
    if (this.listening || this.thinking) {
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      this.speak('Tu navegador no tiene reconocimiento de voz disponible. Puedes usar Chrome o Edge.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'es-PE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => this.listening = true;
    recognition.onerror = () => {
      this.listening = false;
      this.speak('No pude escuchar bien. Intenta otra vez.');
    };
    recognition.onend = () => this.listening = false;
    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript || '';
      this.transcript = text;
      this.ask(text);
    };

    recognition.start();
  }

  private ask(text: string): void {
    if (!text.trim()) {
      return;
    }

    this.thinking = true;

    this.http.post<any>(`${APP_API_BASE_URL}/assistant/voice`, {
      text,
      currentPath: this.router.url
    }, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
      })
    }).subscribe({
      next: res => {
        this.thinking = false;
        this.answer = res?.answer || 'Listo.';
        this.handleAction(res);
        this.speak(this.answer);
      },
      error: () => {
        this.thinking = false;
        this.speak('No pude procesar la solicitud por voz en este momento.');
      }
    });
  }

  private handleAction(res: any): void {
    if (res?.requiresMfa) {
      this.answer = `${res.answer || ''} Por seguridad, esa accion requiere multifactor.`;
    }

    if (res?.action === 'NAVIGATE' && res?.route) {
      this.router.navigate([res.route]);
      return;
    }

    if (res?.action === 'SEARCH' && res?.search) {
      const role = (localStorage.getItem(APP_STORAGE_KEYS.role) || '').toUpperCase();
      const route = role === 'PROVEEDOR'
        ? '/app/provider/products'
        : '/app/rfq/catalog';

      this.router.navigate([route], { queryParams: { search: res.search } });
    }
  }

  private speak(text: string): void {
    if (!('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-PE';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }
}
