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

  async requestActionToken(email: string, purpose: MfaPurpose, method = 'email'): Promise<string> {
    const start: any = await this.startChallenge(email, purpose, method);

    const channel = method === 'email' ? 'correo' : method;
    const code = window.prompt(`Ingresa el codigo multifactor enviado por ${channel}.`);

    if (!code) {
      throw new Error('Verificacion multifactor cancelada.');
    }

    const verified: any = await this.verifyChallenge(email, start.tempToken, code, purpose, method);

    if (!verified?.mfaActionToken) {
      throw new Error('No se pudo obtener la autorizacion multifactor.');
    }

    return verified.mfaActionToken;
  }

  authHeaders(extra?: Record<string, string>): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`,
      ...(extra || {})
    });
  }
}
