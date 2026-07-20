export type ClaimType = 'DEMORA' | 'CANCELACION' | 'ENTREGA_INCOMPLETA';

export function normalizeClaimState(state?: string | null): string {
  return (state || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

export function getAvailableClaimTypes(tracking: any): ClaimType[] {
  const timeline = Array.isArray(tracking?.timeline) ? tracking.timeline : [];
  const normalizedState = normalizeClaimState(tracking?.estado);

  const hasCancellation = timeline.some((step: any) => normalizeClaimState(step?.estado) === 'CANCELADA');
  const hasDelivered = timeline.some((step: any) => ['ENTREGADA', 'COMPLETADA'].includes(normalizeClaimState(step?.estado)));
  const hasDelayWindow = Boolean(tracking?.fechaLimiteEntrega || tracking?.fechaPrometida || tracking?.fechaEntregaPrometida);

  const options: ClaimType[] = ['DEMORA'];

  if (hasCancellation || ['CANCELADA', 'RECHAZADA'].includes(normalizedState)) {
    options.push('CANCELACION');
  }

  if (!hasDelivered || ['PAGO_PENDIENTE', 'PAGO_VALIDANDO'].includes(normalizedState)) {
    options.push('ENTREGA_INCOMPLETA');
  }

  if (hasDelayWindow && options.includes('DEMORA')) {
    return options;
  }

  return options.filter((type) => type !== 'DEMORA' || hasDelayWindow || normalizedState === 'EN_CAMINO');
}
