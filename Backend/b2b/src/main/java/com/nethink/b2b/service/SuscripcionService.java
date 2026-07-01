package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.SuscripcionRequest;
import com.nethink.b2b.dto.response.PayPalOrderResponse;
import com.nethink.b2b.dto.response.SuscripcionStatusResponse;
import com.nethink.b2b.entity.Plan;
import com.nethink.b2b.entity.PlanPrecio;
import com.nethink.b2b.entity.Suscripcion;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.PlanPrecioRepository;
import com.nethink.b2b.repository.PlanRepository;
import com.nethink.b2b.repository.SuscripcionRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SuscripcionService {

    @Autowired
    private SuscripcionRepository suscripcionRepo;

    @Autowired
    private PlanPrecioRepository precioRepo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private PlanRepository planRepo;

    @Autowired
    private PayPalService payPalService;

    // =========================
    // CREAR ORDEN REAL PAYPAL
    // =========================
    public PayPalOrderResponse crearOrden(SuscripcionRequest req) {

        PlanPrecio precio = obtenerOCrearPrecio(req.idPrecio);

        Usuario user = usuarioRepo.findById(req.idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Suscripcion s = new Suscripcion();
        s.setUsuario(user);
        s.setPrecio(precio);
        s.setMontoPagado(precio.getPrecio());
        s.setEstado(Suscripcion.EstadoSuscripcion.PENDIENTE);
        s.setFechaCreacion(LocalDateTime.now());
        s.setFechaActualizacion(LocalDateTime.now());

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
        capturarPago(orderId, 1);
    }

    public void capturarPago(String orderId, Integer meses) {
        Suscripcion s = suscripcionRepo.findAll()
                .stream()
                .filter(x -> orderId.equals(x.getPaypalOrderId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

        int mesesAplicar = meses != null && meses > 0 ? meses : 1;
        LocalDateTime ahora = LocalDateTime.now();

        s.setEstado(Suscripcion.EstadoSuscripcion.ACTIVA);
        s.setFechaInicio(ahora);
        s.setFechaFin(ahora.plusMonths(mesesAplicar));
        s.setFechaActualizacion(ahora);

        suscripcionRepo.save(s);
    }

    public SuscripcionStatusResponse obtenerEstadoSuscripcion(Integer idUsuario) {
        Usuario usuario = usuarioRepo.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Suscripcion> suscripciones = suscripcionRepo.findAll()
                .stream()
                .filter(s -> s.getUsuario() != null && idUsuario.equals(s.getUsuario().getIdUsuario()))
                .sorted(Comparator.comparing(Suscripcion::getFechaCreacion, Comparator.nullsLast(LocalDateTime::compareTo)).reversed())
                .toList();

        if (suscripciones.isEmpty()) {
            return crearEstadoFreemium(usuario);
        }

        Suscripcion suscripcion = suscripciones.get(0);
        boolean activa = suscripcion.getEstado() == Suscripcion.EstadoSuscripcion.ACTIVA &&
                (suscripcion.getFechaFin() == null || !suscripcion.getFechaFin().isBefore(LocalDateTime.now()));

        SuscripcionStatusResponse response = new SuscripcionStatusResponse();
        response.setEstado(suscripcion.getEstado().name());
        response.setPlan(suscripcion.getPrecio() != null && suscripcion.getPrecio().getPlan() != null
                ? suscripcion.getPrecio().getPlan().getNombre()
                : "Freemium");
        response.setIdPrecio(suscripcion.getPrecio() != null ? suscripcion.getPrecio().getIdPrecio() : 1);
        response.setBloqueado(!activa);
        response.setFechaFin(suscripcion.getFechaFin());
        response.setDiasRestantes(calcularDiasRestantes(suscripcion));
        response.setMensaje(activa ? "Acceso activo" : "Tu plan ha vencido. Actualiza tu suscripción para continuar.");

        return response;
    }

    private SuscripcionStatusResponse crearEstadoFreemium(Usuario usuario) {
        LocalDateTime ahora = LocalDateTime.now();
        Suscripcion freemium = new Suscripcion();
        freemium.setUsuario(usuario);
        freemium.setPrecio(obtenerOCrearPrecio(1));
        freemium.setMontoPagado(BigDecimal.ZERO);
        freemium.setEstado(Suscripcion.EstadoSuscripcion.ACTIVA);
        freemium.setFechaInicio(ahora);
        freemium.setFechaFin(ahora.plusDays(30));
        freemium.setFechaCreacion(ahora);
        freemium.setFechaActualizacion(ahora);
        suscripcionRepo.save(freemium);

        SuscripcionStatusResponse response = new SuscripcionStatusResponse();
        response.setEstado("ACTIVA");
        response.setPlan("Freemium");
        response.setIdPrecio(1);
        response.setBloqueado(false);
        response.setFechaFin(freemium.getFechaFin());
        response.setDiasRestantes(calcularDiasRestantes(freemium));
        response.setMensaje("Acceso activo");
        return response;
    }

    private Integer calcularDiasRestantes(Suscripcion suscripcion) {
        if (suscripcion.getFechaFin() == null) {
            return 30;
        }

        long diff = java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), suscripcion.getFechaFin());
        return Math.max(0, (int) diff);
    }

    private PlanPrecio obtenerOCrearPrecio(Integer idPrecio) {
        Optional<PlanPrecio> existente = precioRepo.findById(idPrecio);
        if (existente.isPresent()) {
            return existente.get();
        }

        Plan plan = planRepo.findById(idPrecio).orElseGet(() -> {
            Plan nuevoPlan = new Plan();
            nuevoPlan.setIdPlan(idPrecio);
            nuevoPlan.setNombre(nombrePlan(idPrecio));
            nuevoPlan.setDescripcion("Plan generado automáticamente para el flujo de suscripciones");
            nuevoPlan.setActivo(true);
            nuevoPlan.setFechaCreacion(LocalDateTime.now());
            return planRepo.save(nuevoPlan);
        });

        PlanPrecio precio = new PlanPrecio();
        precio.setIdPrecio(idPrecio);
        precio.setPlan(plan);
        precio.setPeriodoMeses(1);
        precio.setPrecio(precioPorId(idPrecio));
        precio.setActivo(true);
        precio.setFechaCreacion(LocalDateTime.now());
        return precioRepo.save(precio);
    }

    private BigDecimal precioPorId(Integer idPrecio) {
        if (idPrecio == null) {
            return BigDecimal.ZERO;
        }

        return switch (idPrecio) {
            case 2 -> new BigDecimal("249.00");
            case 3 -> new BigDecimal("500.00");
            default -> BigDecimal.ZERO;
        };
    }

    private String nombrePlan(Integer idPrecio) {
        return switch (idPrecio) {
            case 2 -> "Estándar";
            case 3 -> "Premium";
            default -> "Freemium";
        };
    }
}