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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
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
    private PlanRepository planRepo;

    @Autowired
    private PayPalService payPalService;

    // =========================
    // CREAR ORDEN REAL PAYPAL
    // =========================
    public PayPalOrderResponse crearOrden(SuscripcionRequest req) {

        if (req == null || req.getIdUsuario() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "idUsuario es obligatorio");
        }

        Integer idPlan = req.getIdPlan() != null ? req.getIdPlan() : req.getIdPrecio();
        Integer meses = req.getMeses() != null && req.getMeses() > 0 ? req.getMeses() : 1;
        PlanPrecio precio = obtenerPrecioParaPlan(idPlan, meses);

        Usuario user = usuarioRepo.findById(req.idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        LocalDateTime ahora = LocalDateTime.now();
        Suscripcion s = new Suscripcion();
        s.setUsuario(user);
        s.setPrecio(precio);
        s.setMontoPagado(precio.getPrecio());
        s.setEstado(Suscripcion.EstadoSuscripcion.PENDIENTE);
        s.setFechaInicio(ahora);
        s.setFechaFin(ahora.plusMonths(meses));
        s.setFechaCreacion(ahora);
        s.setFechaActualizacion(ahora);

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
    @Transactional
    public void capturarPago(String orderId) {
        capturarPago(orderId, 1);
    }

    @Transactional
    public void capturarPago(String orderId, Integer meses) {
        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("El id de la orden no puede estar vacío");
        }

        Suscripcion s = suscripcionRepo.findByPaypalOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));

        if (s.getEstado() == Suscripcion.EstadoSuscripcion.ACTIVA && s.getPaypalCaptureId() != null) {
            throw new IllegalStateException("La orden ya fue capturada previamente");
        }

        String token = payPalService.obtenerAccessToken();
        Map captura = payPalService.capturarOrden(token, orderId);
        String status = String.valueOf(captura.get("status"));

        if (!"COMPLETED".equalsIgnoreCase(status)) {
            throw new IllegalStateException("La captura de PayPal no fue completada: " + status);
        }

        String captureId = null;
        Object purchaseUnits = captura.get("purchase_units");
        if (purchaseUnits instanceof List<?> purchaseUnitList && !purchaseUnitList.isEmpty()) {
            Object firstPurchaseUnit = purchaseUnitList.get(0);
            if (firstPurchaseUnit instanceof Map<?, ?> purchaseUnitMap) {
                Object payments = purchaseUnitMap.get("payments");
                if (payments instanceof Map<?, ?> paymentsMap) {
                    Object captures = paymentsMap.get("captures");
                    if (captures instanceof List<?> captureList && !captureList.isEmpty()) {
                        Object firstCapture = captureList.get(0);
                        if (firstCapture instanceof Map<?, ?> captureMap) {
                            captureId = String.valueOf(captureMap.get("id"));
                        }
                    }
                }
            }
        }

        int mesesAplicar = meses != null && meses > 0 ? meses : 1;
        LocalDateTime ahora = LocalDateTime.now();

        s.setPaypalCaptureId(captureId);
        s.setPaypalOrderId(orderId);
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
        response.setIdPlan(suscripcion.getPrecio() != null && suscripcion.getPrecio().getPlan() != null
                ? suscripcion.getPrecio().getPlan().getIdPlan()
                : 1);
        response.setIdPrecio(suscripcion.getPrecio() != null ? suscripcion.getPrecio().getIdPrecio() : 1);
        response.setBloqueado(!activa);
        response.setFechaFin(suscripcion.getFechaFin());
        response.setDiasRestantes(calcularDiasRestantes(suscripcion));
        response.setMensaje(activa ? "Acceso activo" : "Tu plan ha vencido. Actualiza tu suscripción para continuar.");

        return response;
    }

    private SuscripcionStatusResponse crearEstadoFreemium(Usuario usuario) {
        LocalDateTime ahora = LocalDateTime.now();
        PlanPrecio precioFreemium = obtenerPrecioParaPlan(1, 1);
        Suscripcion freemium = new Suscripcion();
        freemium.setUsuario(usuario);
        freemium.setPrecio(precioFreemium);
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
        response.setIdPlan(1);
        response.setIdPrecio(precioFreemium.getIdPrecio());
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

    private PlanPrecio obtenerPrecioParaPlan(Integer idPlan, Integer meses) {
        if (idPlan == null || meses == null || meses <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe indicar un plan y un periodo de meses válido");
        }

        return precioRepo.findByPlan_IdPlanAndPeriodoMesesAndActivoTrue(idPlan, meses)
                .orElseGet(() -> {
                    Plan plan = planRepo.findById(idPlan).orElseGet(() -> {
                        Plan nuevoPlan = new Plan();
                        nuevoPlan.setNombre(nombrePlan(idPlan));
                        nuevoPlan.setDescripcion("Plan generado automáticamente para el flujo de suscripciones");
                        nuevoPlan.setActivo(true);
                        nuevoPlan.setFechaCreacion(LocalDateTime.now());
                        return planRepo.save(nuevoPlan);
                    });

                    PlanPrecio precio = new PlanPrecio();
                    precio.setPlan(plan);
                    precio.setPeriodoMeses(meses);
                    precio.setPrecio(precioPorId(idPlan, meses));
                    precio.setActivo(true);
                    precio.setFechaCreacion(LocalDateTime.now());
                    return precioRepo.save(precio);
                });
    }

    private BigDecimal precioPorId(Integer idPlan, Integer meses) {
        if (idPlan == null) {
            return BigDecimal.ZERO;
        }

        return switch (idPlan) {
            case 2 -> switch (meses) {
                case 3 -> new BigDecimal("747.00");
                case 6 -> new BigDecimal("1494.00");
                default -> new BigDecimal("249.00");
            };
            case 3 -> switch (meses) {
                case 3 -> new BigDecimal("1500.00");
                case 6 -> new BigDecimal("3000.00");
                default -> new BigDecimal("500.00");
            };
            default -> BigDecimal.ZERO;
        };
    }

    private String nombrePlan(Integer idPlan) {
        return switch (idPlan) {
            case 2 -> "Estandar";
            case 3 -> "Premium";
            default -> "Freemium";
        };
    }
}