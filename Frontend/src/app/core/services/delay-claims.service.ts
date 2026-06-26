import { Injectable } from '@angular/core';

export interface DelayClaim {
  id: string;
  idSolicitud: number;
  idProveedor?: number | null;
  proveedor: string;
  empresaCliente: string;
  orderCode: string;
  motivo: 'DEMORA_ENTREGA';
  descripcion: string;
  fechaPrometida: string;
  diasDemora: number;
  estado: 'PENDIENTE_PROVEEDOR' | 'RESPONDIDO' | 'CERRADO';
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DelayClaimsService {
  private readonly storageKey = 'delivery_delay_claims';

  getAll(): DelayClaim[] {
    const raw = localStorage.getItem(this.storageKey);

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  getBySolicitud(idSolicitud: number | string | null | undefined): DelayClaim | null {
    const id = Number(idSolicitud);

    if (!Number.isFinite(id)) {
      return null;
    }

    return this.getAll().find(claim => Number(claim.idSolicitud) === id) || null;
  }

  save(claim: Omit<DelayClaim, 'id' | 'createdAt' | 'updatedAt' | 'estado'>): DelayClaim {
    const claims = this.getAll();
    const now = new Date().toISOString();
    const existingIndex = claims.findIndex(item => Number(item.idSolicitud) === Number(claim.idSolicitud));

    const nextClaim: DelayClaim = {
      ...(existingIndex >= 0 ? claims[existingIndex] : {}),
      ...claim,
      id: existingIndex >= 0 ? claims[existingIndex].id : `delay-${claim.idSolicitud}-${Date.now()}`,
      estado: existingIndex >= 0 ? claims[existingIndex].estado : 'PENDIENTE_PROVEEDOR',
      createdAt: existingIndex >= 0 ? claims[existingIndex].createdAt : now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      claims[existingIndex] = nextClaim;
    } else {
      claims.unshift(nextClaim);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(claims));
    window.dispatchEvent(new CustomEvent('deliveryDelayClaimsUpdated', { detail: nextClaim }));

    return nextClaim;
  }
}
