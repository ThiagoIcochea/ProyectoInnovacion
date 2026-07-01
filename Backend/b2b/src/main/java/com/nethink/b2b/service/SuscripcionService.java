package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.SuscripcionRequest;
import com.nethink.b2b.dto.response.PayPalOrderResponse;
import com.nethink.b2b.entity.PlanPrecio;
import com.nethink.b2b.entity.Suscripcion;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.PlanPrecioRepository;
import com.nethink.b2b.repository.SuscripcionRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class SuscripcionService {

    @Autowired
    private SuscripcionRepository suscripcionRepo;

    @Autowired
    private PlanPrecioRepository precioRepo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private PayPalService payPalService;

    // =========================
    // CREAR ORDEN REAL PAYPAL
    // =========================
    public PayPalOrderResponse crearOrden(SuscripcionRequest req) {

        PlanPrecio precio = precioRepo.findById(req.idPrecio)
                .orElseThrow(() -> new RuntimeException("Precio no encontrado"));

        Usuario user = usuarioRepo.findById(req.idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

   
        Suscripcion s = new Suscripcion();
        s.setUsuario(user);
        s.setPrecio(precio);
        s.setMontoPagado(precio.getPrecio());
        s.setEstado(Suscripcion.EstadoSuscripcion.PENDIENTE);

        suscripcionRepo.save(s);

        // 2. TOKEN REAL PAYPAL (sandbox)
        String token = payPalService.obtenerAccessToken();

        // 3. Crear orden en PayPal
        Map order = payPalService.crearOrden(
                token,
                precio.getPrecio().toString()
        );

        String orderId = order.get("id").toString();
        String approvalUrl = payPalService.obtenerApprovalUrl(order);

        // 4. Guardar orderId real de PayPal
        s.setPaypalOrderId(orderId);
        suscripcionRepo.save(s);

        // 5. Respuesta al frontend
        PayPalOrderResponse res = new PayPalOrderResponse();
        res.orderId = orderId;
        res.approvalUrl = approvalUrl;

        return res;
    }

    // =========================
    // CAPTURAR PAGO
    // =========================
    public void capturarPago(String orderId) {

        Suscripcion s = suscripcionRepo.findAll()
                .stream()
                .filter(x -> orderId.equals(x.getPaypalOrderId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

        s.setEstado(Suscripcion.EstadoSuscripcion.ACTIVA);
        s.setFechaInicio(LocalDateTime.now());
        
        suscripcionRepo.save(s);
    }
}