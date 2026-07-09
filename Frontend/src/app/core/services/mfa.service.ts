import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../constants/app.constants';

export type MfaPurpose =
  'LOGIN' |
  'REGISTER_CLIENT' |
  'REGISTER_PROVIDER' |
  'PROFILE_UPDATE' |
  'PROVIDER_API_UPDATE' |
  'ADMIN_ACTION';

type MfaMethod = 'email' | 'sms' | 'whatsapp' | 'call';

@Injectable({ providedIn: 'root' })
export class MfaService {

  constructor(private http: HttpClient) {}

  startChallenge(email: string, purpose: MfaPurpose, method = 'email'): Promise<any> {
    return firstValueFrom(this.http.post(`${APP_API_BASE_URL}/auth/mfa/challenge`, {
      email,
      purpose,
      method
    }));
  }

  verifyChallenge(email: string, tempToken: string, code: string, purpose: MfaPurpose, method = 'email'): Promise<any> {
    return firstValueFrom(this.http.post(`${APP_API_BASE_URL}/auth/mfa/verify`, {
      email,
      tempToken,
      code,
      method,
      purpose
    }));
  }

  async requestActionToken(email: string, purpose: MfaPurpose, method?: MfaMethod | string): Promise<string> {
    let selectedMethod = this.resolveMethod(method);
    let start: any;

    try {
      start = await this.startChallenge(email, purpose, selectedMethod);
    } catch (error) {
      if (selectedMethod === 'email') {
        throw error;
      }

      selectedMethod = 'email';
      start = await this.startChallenge(email, purpose, selectedMethod);
    }

    const channel = this.methodLabel(selectedMethod);
    const code = window.prompt(`Ingresa el codigo multifactor enviado por ${channel}.`);

    if (!code) {
      throw new Error('Verificacion multifactor cancelada.');
    }

    const verified: any = await this.verifyChallenge(email, start.tempToken, code, purpose, selectedMethod);

    if (!verified?.mfaActionToken) {
      throw new Error('No se pudo obtener la autorizacion multifactor.');
    }

    return verified.mfaActionToken;
  }

  private resolveMethod(method?: MfaMethod | string): MfaMethod {
    const normalized = String(method || '').trim().toLowerCase();

    if (this.isMethod(normalized)) {
      return normalized;
    }

    const selected = window.prompt(
      'Elige el medio MFA: correo, sms, whatsapp o llamada.',
      'whatsapp'
    );

    return this.normalizeMethod(selected);
  }

  private normalizeMethod(value: string | null | undefined): MfaMethod {
    const normalized = String(value || '').trim().toLowerCase();

    if (normalized === 'correo' || normalized === 'email') {
      return 'email';
    }

    if (normalized === 'llamada' || normalized === 'call') {
      return 'call';
    }

    if (this.isMethod(normalized)) {
      return normalized;
    }

    return 'email';
  }

  private isMethod(value: string): value is MfaMethod {
    return ['email', 'sms', 'whatsapp', 'call'].includes(value);
  }

  private methodLabel(method: MfaMethod): string {
    const labels: Record<MfaMethod, string> = {
      email: 'correo',
      sms: 'SMS',
      whatsapp: 'WhatsApp',
      call: 'llamada'
    };

    return labels[method];
  }

  authHeaders(extra?: Record<string, string>): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`,
      ...(extra || {})
    });
  }
}
