import { HttpClient } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';
import { MfaService } from './mfa.service';

describe('MfaService modal prompts', () => {
  it('delegates code entry to an injected prompt handler when provided', async () => {
    const service = new MfaService({} as HttpClient);
    const handler = vi.fn().mockResolvedValue('123456');

    const code = await (service as any).promptForCode('correo', handler);

    expect(handler).toHaveBeenCalled();
    expect(code).toBe('123456');
  });
});
