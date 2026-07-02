import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { APP_API_BASE_URL, APP_STORAGE_KEYS } from '../../core/constants/app.constants';
import { MfaService } from '../../core/services/mfa.service';

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
  private pending:
    | { type: 'TRACKING_ID' }
    | { type: 'ADD_PRODUCT'; qty: number }
    | { type: 'PROFILE_FIELD' }
    | { type: 'PROFILE_VALUE'; field: string }
    | { type: 'ORDER_RUC' }
    | { type: 'ORDER_ADDRESS'; ruc: string }
    | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private mfaService: MfaService
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
      this.handleVoice(text);
    };

    recognition.start();
  }

  private async handleVoice(text: string): Promise<void> {
    const handled = await this.handleLocalIntent(text);

    if (!handled) {
      this.askGroq(text);
    }
  }

  private askGroq(text: string): void {
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

  private async handleLocalIntent(text: string): Promise<boolean> {
    const normalized = this.normalize(text);
    const role = (localStorage.getItem(APP_STORAGE_KEYS.role) || '').toUpperCase();

    if (this.pending) {
      return this.continuePending(text, normalized);
    }

    if (this.includesAny(normalized, ['cerrar sesion', 'salir de mi cuenta', 'logout', 'desconectarme'])) {
      this.logout();
      return true;
    }

    if (this.includesAny(normalized, ['tracking', 'seguimiento', 'rastrear', 'seguir pedido', 'ver pedido'])) {
      if (role !== 'CLIENTE') {
        this.say('El tracking de pedidos esta disponible para clientes. Te llevo a tu panel correspondiente.');
        this.router.navigate([role === 'PROVEEDOR' ? '/app/provider/requests' : '/app/admin/dashboard']);
        return true;
      }

      const id = this.extractRequestId(normalized);
      if (!id) {
        this.pending = { type: 'TRACKING_ID' };
        this.say('Claro. Dime el numero de solicitud o el codigo RFQ que quieres rastrear.');
        return true;
      }

      this.openTracking(id);
      return true;
    }

    if (this.includesAny(normalized, ['agrega', 'agregar', 'anade', 'añade', 'pon en carrito', 'al carrito'])) {
      if (role !== 'CLIENTE') {
        this.say('Solo el cliente puede agregar productos al carrito RFQ. Puedo ayudarte a revisar tus solicitudes o productos segun tu rol.');
        return true;
      }

      const qty = this.extractQuantity(normalized) || 1;
      const productQuery = this.cleanProductQuery(normalized);

      if (!productQuery) {
        this.pending = { type: 'ADD_PRODUCT', qty };
        this.say('Listo. Dime el nombre del producto que quieres agregar al carrito.');
        return true;
      }

      await this.addProductToCart(productQuery, qty);
      return true;
    }

    if (this.includesAny(normalized, ['crear solicitud', 'generar solicitud', 'buscar proveedores', 'crear rfq', 'cotizar carrito'])) {
      if (role !== 'CLIENTE') {
        this.say('Las solicitudes RFQ las crea el cliente. Con tu rol puedo navegar a tus operaciones permitidas.');
        return true;
      }

      await this.createRfqFromCart();
      return true;
    }

    if (this.includesAny(normalized, ['mejor proveedor', 'selecciona proveedor', 'elige proveedor'])) {
      if (role !== 'CLIENTE') {
        this.say('La seleccion de proveedor corresponde al flujo del cliente.');
        return true;
      }

      this.selectBestProvider();
      return true;
    }

    if (this.includesAny(normalized, ['confirmar pedido', 'confirmar solicitud', 'realizar pedido', 'crear pedido'])) {
      if (role !== 'CLIENTE') {
        this.say('La confirmacion de pedido corresponde al cliente.');
        return true;
      }

      await this.startOrderConfirmation(normalized);
      return true;
    }

    if (this.includesAny(normalized, ['actualiza mi cuenta', 'actualizar mi cuenta', 'cambiar mi perfil', 'actualiza mi perfil', 'cambia mi telefono', 'cambia mi whatsapp', 'cambia mi direccion', 'cambia mi correo'])) {
      await this.startProfileUpdate(normalized);
      return true;
    }

    return false;
  }

  private async continuePending(text: string, normalized: string): Promise<boolean> {
    const pending = this.pending;
    this.pending = null;

    if (!pending) {
      return false;
    }

    if (pending.type === 'TRACKING_ID') {
      const id = this.extractRequestId(normalized);
      if (!id) {
        this.pending = pending;
        this.say('Aun no veo un numero de solicitud. Dime algo como RFQ 2026 12 o solicitud 12.');
        return true;
      }
      this.openTracking(id);
      return true;
    }

    if (pending.type === 'ADD_PRODUCT') {
      await this.addProductToCart(text, pending.qty);
      return true;
    }

    if (pending.type === 'PROFILE_FIELD') {
      const field = this.detectProfileField(normalized);
      if (!field) {
        this.pending = pending;
        this.say('Puedo cambiar telefono, WhatsApp, direccion, nombres, apellidos o correo. Dime cual campo quieres actualizar.');
        return true;
      }
      this.pending = { type: 'PROFILE_VALUE', field };
      this.say(`Perfecto. Dime el nuevo valor para ${this.profileFieldLabel(field)}.`);
      return true;
    }

    if (pending.type === 'PROFILE_VALUE') {
      await this.updateProfileField(pending.field, text.trim());
      return true;
    }

    if (pending.type === 'ORDER_RUC') {
      const ruc = this.extractRuc(normalized);
      if (!ruc) {
        this.pending = pending;
        this.say('Necesito un RUC de 11 digitos para registrar la empresa compradora.');
        return true;
      }
      this.pending = { type: 'ORDER_ADDRESS', ruc };
      this.say('Ahora dime la direccion de entrega.');
      return true;
    }

    if (pending.type === 'ORDER_ADDRESS') {
      await this.confirmOrder(pending.ruc, text.trim());
      return true;
    }

    return true;
  }

  private logout(): void {
    localStorage.removeItem(APP_STORAGE_KEYS.token);
    localStorage.removeItem(APP_STORAGE_KEYS.role);
    localStorage.removeItem(APP_STORAGE_KEYS.rfqCart);
    localStorage.removeItem(APP_STORAGE_KEYS.selectedProvider);
    localStorage.removeItem(APP_STORAGE_KEYS.currentSolicitudId);
    localStorage.removeItem('auth_user_email');
    localStorage.removeItem('auth_user_id');
    sessionStorage.removeItem('pending_mfa_flow');
    this.say('Sesion cerrada. Te llevo al login.');
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private openTracking(id: number): void {
    this.say(`Abriendo seguimiento de la solicitud ${id}.`);
    this.router.navigate(['/app/requests/tracking', id]);
  }

  private async addProductToCart(query: string, qty: number): Promise<void> {
    this.thinking = true;

    try {
      const products = await this.fetchProducts();
      const normalizedQuery = this.normalize(query);
      const product = products.find((item: any) => this.productMatches(item, normalizedQuery));

      if (!product) {
        this.thinking = false;
        this.pending = { type: 'ADD_PRODUCT', qty };
        this.say('No encontre ese producto con claridad. Dime otro nombre, marca o categoria.');
        return;
      }

      const cart = this.readCart();
      const existing = cart.find((item: any) => item.idProducto === product.idProducto);

      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({
          idProducto: product.idProducto,
          name: product.producto,
          detail: `${product.marca || ''} - ${String(product.descripcion || '').substring(0, 30)}...`,
          qty,
          precioReferencia: product.precioUnitario ?? null,
          categoria: product.categoria,
          marca: product.marca
        });
      }

      localStorage.setItem(APP_STORAGE_KEYS.rfqCart, JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('voiceCartUpdated', { detail: cart }));
      this.thinking = false;
      this.say(`Agregue ${qty} unidad${qty === 1 ? '' : 'es'} de ${product.producto} al carrito RFQ.`);
      this.router.navigate(['/app/rfq/catalog'], { queryParams: { search: product.producto } });
    } catch {
      this.thinking = false;
      this.say('No pude consultar el catalogo para agregar el producto.');
    }
  }

  private async createRfqFromCart(): Promise<void> {
    const cart = this.readCart();

    if (!cart.length) {
      this.pending = { type: 'ADD_PRODUCT', qty: 1 };
      this.say('Tu carrito RFQ esta vacio. Dime que producto necesitas y lo agrego primero.');
      return;
    }

    this.thinking = true;
    this.http.post<any[]>(`${APP_API_BASE_URL}/rfq/buscar-proveedores`, {
      items: cart.map((item: any) => ({
        idProducto: item.idProducto,
        cantidad: item.qty
      })),
      filtro: {
        precioMin: null,
        precioMax: null,
        marcas: [],
        categorias: []
      },
      prioridad: 'BALANCEADO'
    }, {
      headers: this.headers()
    }).subscribe({
      next: providers => {
        this.thinking = false;
        sessionStorage.setItem('voice_last_providers', JSON.stringify(providers || []));
        this.say(`Encontre ${(providers || []).length} proveedores compatibles. Te muestro las opciones.`);
        this.router.navigate(['/app/rfq/results'], { state: { proveedores: providers || [] } });
      },
      error: () => {
        this.thinking = false;
        this.say('No pude buscar proveedores para tu carrito. Revisa los productos e intenta nuevamente.');
      }
    });
  }

  private selectBestProvider(): void {
    const raw = sessionStorage.getItem('voice_last_providers');
    const providers = raw ? JSON.parse(raw) : [];
    const provider = providers?.[0];

    if (!provider) {
      this.say('No tengo proveedores calculados todavia. Primero dime crear solicitud o buscar proveedores.');
      return;
    }

    localStorage.setItem(APP_STORAGE_KEYS.selectedProvider, JSON.stringify(provider));
    this.say(`Seleccione a ${provider.nombreProveedor || 'el mejor proveedor'}. Te llevo al detalle de cotizacion.`);
    this.router.navigate(['/app/rfq/quotation']);
  }

  private async startOrderConfirmation(normalized: string): Promise<void> {
    const provider = this.readSelectedProvider();
    if (!provider) {
      this.say('Primero debes seleccionar un proveedor. Puedo elegir el mejor proveedor si ya buscaste proveedores.');
      return;
    }

    const ruc = this.extractRuc(normalized);
    if (!ruc) {
      this.pending = { type: 'ORDER_RUC' };
      this.say('Para confirmar el pedido necesito el RUC de la empresa compradora.');
      return;
    }

    this.pending = { type: 'ORDER_ADDRESS', ruc };
    this.say('Perfecto. Ahora dime la direccion de entrega.');
  }

  private async confirmOrder(ruc: string, address: string): Promise<void> {
    if (!address) {
      this.pending = { type: 'ORDER_ADDRESS', ruc };
      this.say('Necesito una direccion de entrega para continuar.');
      return;
    }

    const provider = this.readSelectedProvider();
    if (!provider) {
      this.say('Ya no encuentro el proveedor seleccionado. Vuelve a seleccionar uno.');
      return;
    }

    const products = provider.items ?? provider.itemsDetalle ?? provider.productos ?? [];
    const total = Number(provider.totalCotizacion || 0);
    const subtotal = Number((total / 1.18).toFixed(2));
    const igv = Number((total - subtotal).toFixed(2));

    this.thinking = true;

    this.http.post<any>(`${APP_API_BASE_URL}/empresas`, { ruc }, { headers: this.headers() })
      .subscribe({
        next: empresa => {
          this.http.post<any>(`${APP_API_BASE_URL}/solicitudes/crear`, {
            idEmpresa: empresa.idEmpresa,
            idProveedor: provider.idProveedor,
            subtotal,
            igv,
            total,
            direccionEnvio: address,
            items: products.map((p: any) => ({
              idProducto: p.idProducto,
              cantidad: Number(p.cantidad ?? p.qty ?? 1),
              precioUnitario: Number(p.precioUnitario ?? p.precioReferencia ?? 0)
            }))
          }, { headers: this.headers() }).subscribe({
            next: res => {
              localStorage.setItem(APP_STORAGE_KEYS.currentSolicitudId, String(res.idSolicitud));
              localStorage.removeItem(APP_STORAGE_KEYS.rfqCart);
              localStorage.removeItem(APP_STORAGE_KEYS.selectedProvider);
              this.thinking = false;
              this.say(`Solicitud creada correctamente. La abro en tus solicitudes.`);
              this.router.navigate(['/app/requests']);
            },
            error: () => {
              this.thinking = false;
              this.say('No pude crear la solicitud. Revisa la cotizacion e intenta nuevamente.');
            }
          });
        },
        error: () => {
          this.thinking = false;
          this.say('No pude registrar o validar la empresa con ese RUC.');
        }
      });
  }

  private async startProfileUpdate(normalized: string): Promise<void> {
    const field = this.detectProfileField(normalized);
    const value = field ? this.extractProfileValue(normalized, field) : '';

    if (!field) {
      this.pending = { type: 'PROFILE_FIELD' };
      this.say('Puedo actualizar telefono, WhatsApp, direccion, nombres, apellidos o correo. Que campo quieres cambiar?');
      return;
    }

    if (!value) {
      this.pending = { type: 'PROFILE_VALUE', field };
      this.say(`Dime el nuevo valor para ${this.profileFieldLabel(field)}.`);
      return;
    }

    await this.updateProfileField(field, value);
  }

  private async updateProfileField(field: string, value: string): Promise<void> {
    if (!value.trim()) {
      this.pending = { type: 'PROFILE_VALUE', field };
      this.say(`Necesito el nuevo valor para ${this.profileFieldLabel(field)}.`);
      return;
    }

    this.thinking = true;

    try {
      const profile: any = await this.http.get(`${APP_API_BASE_URL}/usuarios/perfil`, { headers: this.headers() }).toPromise();
      const currentEmail = localStorage.getItem('auth_user_email') || profile?.correo || '';
      const mfaToken = await this.mfaService.requestActionToken(currentEmail, 'PROFILE_UPDATE');
      const formData = new FormData();
      const next = { ...profile, [field]: value.trim() };

      formData.append('nombres', next.nombres || '');
      formData.append('apellidos', next.apellidos || '');
      formData.append('correo', next.correo || '');
      formData.append('telefono', next.telefono || '');
      formData.append('whatsapp', next.whatsapp || '');
      formData.append('direccion', next.direccion || '');
      formData.append('notificaciones', String(next.notificacionesRfq ?? next.preferencias?.notificaciones ?? true));
      formData.append('entregaRapida', String(next.entregaRapida ?? next.preferencias?.entregaRapida ?? false));

      await this.http.put(`${APP_API_BASE_URL}/usuarios/perfil`, formData, {
        headers: this.authOnlyHeaders().set('X-MFA-Authorization', mfaToken)
      }).toPromise();

      if (field === 'correo') {
        localStorage.setItem('auth_user_email', value.trim());
      }

      window.dispatchEvent(new CustomEvent('profileUpdated'));
      this.thinking = false;
      this.say(`${this.profileFieldLabel(field)} actualizado correctamente.`);
      this.router.navigate(['/app/profile']);
    } catch (error: any) {
      this.thinking = false;
      this.say(error?.message || 'No pude actualizar tu perfil.');
    }
  }

  private fetchProducts(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.http.post<any[]>(`${APP_API_BASE_URL}/productos/catalogo/filtrado`, {
        categorias: null,
        marcas: null,
        especificaciones: []
      }, {
        headers: this.headers()
      }).subscribe({
        next: res => resolve(Array.isArray(res) ? res : []),
        error: reject
      });
    });
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`,
      'Content-Type': 'application/json'
    });
  }

  private authOnlyHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem(APP_STORAGE_KEYS.token)}`
    });
  }

  private readCart(): any[] {
    const raw = localStorage.getItem(APP_STORAGE_KEYS.rfqCart);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private readSelectedProvider(): any | null {
    const raw = localStorage.getItem(APP_STORAGE_KEYS.selectedProvider);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private say(text: string): void {
    this.answer = text;
    this.speak(text);
  }

  private normalize(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s@.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private includesAny(value: string, terms: string[]): boolean {
    return terms.some(term => value.includes(this.normalize(term)));
  }

  private extractRequestId(value: string): number | null {
    const rfq = value.match(/rfq\s*(?:2026)?\s*(\d+)/i);
    const generic = value.match(/(?:solicitud|pedido|numero)\s*(\d+)/i);
    const anyNumber = value.match(/\b(\d{1,6})\b/);
    const match = rfq || generic || anyNumber;
    return match ? Number(match[1]) : null;
  }

  private extractQuantity(value: string): number | null {
    const match = value.match(/\b(\d{1,3})\b/);
    return match ? Math.max(1, Number(match[1])) : null;
  }

  private extractRuc(value: string): string {
    return value.replace(/\D/g, '').match(/\d{11}/)?.[0] || '';
  }

  private cleanProductQuery(value: string): string {
    return value
      .replace(/\b(agrega|agregar|anade|añade|pon|en|al|carrito|un|una|unos|unas|\d+|producto|productos|por favor)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private productMatches(product: any, query: string): boolean {
    const haystack = this.normalize([
      product.producto,
      product.marca,
      product.categoria,
      product.descripcion,
      ...(product.especificaciones || []).map((spec: any) => `${spec?.nombre || ''} ${spec?.valor || ''}`)
    ].filter(Boolean).join(' '));

    return query.split(' ').filter(Boolean).every(part => haystack.includes(part));
  }

  private detectProfileField(value: string): string {
    if (value.includes('telefono') || value.includes('celular')) return 'telefono';
    if (value.includes('whatsapp')) return 'whatsapp';
    if (value.includes('direccion')) return 'direccion';
    if (value.includes('correo') || value.includes('email')) return 'correo';
    if (value.includes('nombre')) return 'nombres';
    if (value.includes('apellido')) return 'apellidos';
    return '';
  }

  private extractProfileValue(value: string, field: string): string {
    const label = this.normalize(this.profileFieldLabel(field));
    const patterns = [
      new RegExp(`${field}\\s+(?:a|por|es)\\s+(.+)$`),
      new RegExp(`${label}\\s+(?:a|por|es)\\s+(.+)$`),
      /(?:a|por|es)\s+(.+)$/
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return '';
  }

  private profileFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      telefono: 'telefono',
      whatsapp: 'WhatsApp',
      direccion: 'direccion',
      correo: 'correo',
      nombres: 'nombres',
      apellidos: 'apellidos'
    };

    return labels[field] || field;
  }
}
