package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.SolicitudCrearRequest;
import com.nethink.b2b.dto.response.SolicitudHistorialResponse;
import com.nethink.b2b.dto.response.TrackingResponse;
import com.nethink.b2b.dto.response.TrackingStepResponse;
import com.nethink.b2b.dto.response.SolicitudResponse;
import com.nethink.b2b.entity.*;
import com.nethink.b2b.entity.Solicitud.EstadoSolicitud;
import com.nethink.b2b.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SolicitudService {

    private final SolicitudRepository solicitudRepo;
    private final DetalleSolicitudRepository detalleRepo;
    private final ProveedorProductoRepository provProdRepo;
    private final UsuarioRepository usuarioRepo;
    private final ProveedorRepository proveedorRepo;
    private final SolicitudHistorialRepository historialRepo;
    private final EmailService emailService;

    public SolicitudService(
            SolicitudRepository solicitudRepo,
            DetalleSolicitudRepository detalleRepo,
            ProveedorProductoRepository provProdRepo,
            UsuarioRepository usuarioRepo,
            ProveedorRepository proveedorRepo,
            SolicitudHistorialRepository historialRepo,
            EmailService emailService
    ) {
        this.solicitudRepo = solicitudRepo;
        this.detalleRepo = detalleRepo;
        this.provProdRepo = provProdRepo;
        this.usuarioRepo = usuarioRepo;
        this.proveedorRepo = proveedorRepo;
        this.historialRepo = historialRepo;
        this.emailService = emailService;
    }

    @Transactional
    public Solicitud crearSolicitud(SolicitudCrearRequest request, String correoCliente) {

        Usuario cliente = usuarioRepo.findByCorreo(correoCliente)
                .orElseThrow();

        Proveedor proveedor = proveedorRepo.findById(request.idProveedor())
                .orElseThrow();

        Solicitud sol = new Solicitud();

        sol.setUsuario(cliente);
        sol.setProveedor(proveedor);
        sol.setDireccionEnvio(request.direccionEnvio());
        sol.setEstado(EstadoSolicitud.PAGO_PENDIENTE);

        LocalDateTime ahora = LocalDateTime.now();

        sol.setFechaCreacion(ahora);
        sol.setCodigoUsado(false);
        sol.setCodigoRecepcion(generarCodigoRecepcion());

        BigDecimal total = BigDecimal.ZERO;
        int maxDiasEntrega = 0;

        Solicitud guardada = solicitudRepo.save(sol);

        for (var itemReq : request.items()) {

            ProveedorProducto pp = provProdRepo.buscarPorProveedorYProducto(
                    request.idProveedor(),
                    itemReq.idProducto()
            ).orElseThrow();

            BigDecimal cantidad = BigDecimal.valueOf(itemReq.cantidad());
            BigDecimal totalItem = pp.getPrecio().multiply(cantidad);

            total = total.add(totalItem);

            if (pp.getTiempoEntregaDias() != null &&
                    pp.getTiempoEntregaDias() > maxDiasEntrega) {
                maxDiasEntrega = pp.getTiempoEntregaDias();
            }

            DetalleSolicitud detalle = new DetalleSolicitud();
            detalle.setSolicitud(guardada);
            detalle.setProveedorProducto(pp);
            detalle.setCantidad(itemReq.cantidad());
            detalle.setPrecioUnitario(pp.getPrecio());
            detalle.setTiempoEntregaDias(pp.getTiempoEntregaDias());
            detalle.setGarantiaMeses(pp.getGarantiaMeses());

            detalleRepo.save(detalle);
        }

        total = total.setScale(2, RoundingMode.HALF_UP);

        BigDecimal subtotal = total.divide(BigDecimal.valueOf(1.18), 2, RoundingMode.HALF_UP);
        BigDecimal igv = total.subtract(subtotal).setScale(2, RoundingMode.HALF_UP);

        guardada.setSubtotal(subtotal);
        guardada.setIgv(igv);
        guardada.setTotal(total);

        LocalDateTime fechaEntrega = ahora.plusDays(maxDiasEntrega);

        guardada.setFechaLimiteEntrega(fechaEntrega);
        guardada.setFechaEntrega(fechaEntrega);

        Solicitud finalizada = solicitudRepo.save(guardada);

        SolicitudHistorial historial = new SolicitudHistorial();
        historial.setSolicitud(finalizada);
        historial.setEstado(EstadoSolicitud.CREADA.name());
        historial.setIdUsuario(cliente.getIdUsuario());
        historial.setDescripcion("Solicitud registrada correctamente");
        historial.setFecha(LocalDateTime.now());

        historialRepo.save(historial);

        try {
            emailService.enviarCorreoCliente(finalizada);
            emailService.enviarCorreoProveedor(finalizada);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return finalizada;
    }

    public List<SolicitudResponse> listarMisSolicitudes(Integer idUsuario) {

        List<Solicitud> solicitudes = solicitudRepo.findByUsuarioOptimized(idUsuario);

        return solicitudes.stream().map(s -> {

            SolicitudResponse dto = new SolicitudResponse();

            dto.setIdSolicitud(s.getIdSolicitud());
            dto.setIdProveedor(s.getProveedor().getIdProveedor());
            dto.setNombreProveedor(s.getProveedor().getRazonSocial());
            dto.setTotal(s.getTotal());
            dto.setEstado(formatearEstado(s.getEstado()));
            dto.setFechaCreacion(s.getFechaCreacion());

            return dto;

        }).collect(Collectors.toList());
    }

    public TrackingResponse obtenerTracking(Integer idSolicitud) {

    Solicitud s = solicitudRepo.buscarTracking(idSolicitud)
            .orElseThrow();

    TrackingResponse r = new TrackingResponse();

    r.setIdSolicitud(s.getIdSolicitud());
    r.setIdProveedor(s.getProveedor().getIdProveedor());
    r.setProveedor(s.getProveedor().getRazonSocial());
    r.setEstado(formatearEstado(s.getEstado()));
    r.setTotal(s.getTotal());
    r.setDireccion(s.getDireccionEnvio());
    r.setCodigoRecepcion(s.getCodigoRecepcion());
    r.setFechaEntrega(s.getFechaEntrega());

    List<SolicitudHistorial> historiales =
            historialRepo.findBySolicitud_IdSolicitudOrderByFechaAsc(
                    idSolicitud
            );

    List<TrackingStepResponse> timeline = historiales.stream()
            .map(h -> {

                TrackingStepResponse step =
                        new TrackingStepResponse();

                step.setEstado(
                        formatearEstado(
                                EstadoSolicitud.valueOf(h.getEstado())
                        )
                );

                step.setDescripcion(h.getDescripcion());

                step.setFecha(h.getFecha());

                return step;

            }).collect(Collectors.toList());

    r.setTimeline(timeline);

    return r;
}
 public Map<String, String> cancelarSolicitud(Integer idSolicitud, String correoUsuario) {

    Solicitud solicitud = solicitudRepo.findById(idSolicitud)
            .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

    Usuario usuario = usuarioRepo.findByCorreo(correoUsuario)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    solicitud.setEstado(EstadoSolicitud.CANCELADA);

    solicitudRepo.save(solicitud);

    SolicitudHistorial historial = new SolicitudHistorial();
    historial.setSolicitud(solicitud);
    historial.setIdUsuario(usuario.getIdUsuario());
    historial.setEstado(EstadoSolicitud.CANCELADA.name());
    historial.setDescripcion("Solicitud cancelada por el usuario");
    historial.setFecha(LocalDateTime.now());

    historialRepo.save(historial);

    return Map.of(
            "message", "Solicitud cancelada correctamente"
    );
}
    private String generarCodigoRecepcion() {

        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        String codigo;

        do {
            StringBuilder sb = new StringBuilder("NP");

            for (int i = 0; i < 6; i++) {
                int idx = (int) (Math.random() * chars.length());
                sb.append(chars.charAt(idx));
            }

            codigo = sb.toString();

        } while (solicitudRepo.existsByCodigoRecepcion(codigo));

        return codigo;
    }

    private String formatearEstado(EstadoSolicitud estado) {

        return switch (estado) {
            case CREADA -> "Creada";
            case PAGO_PENDIENTE -> "Pago pendiente";
            case PAGO_VALIDANDO -> "Validando pago";
            case EN_CAMINO -> "En camino";
            case ENTREGADA -> "Entregado";
            case CANCELADA -> "Cancelada";
            default -> throw new IllegalStateException("Unexpected value: " + (estado));
        };
    }
    
    public List<SolicitudHistorialResponse> listarHistorial(Integer idUsuario) {

    List<Solicitud> solicitudes = solicitudRepo.findByUsuarioOptimized(idUsuario);

    return solicitudes.stream()

            .filter(s ->
                    s.getEstado() == EstadoSolicitud.CANCELADA ||
                    s.getEstado() == EstadoSolicitud.ENTREGADA ||
                    s.getEstado() == EstadoSolicitud.COMPLETADA
            )

            .map(s -> {

                SolicitudHistorial historialActual =
                        historialRepo
                                .findTopBySolicitud_IdSolicitudAndEstadoOrderByFechaDesc(
                                        s.getIdSolicitud(),
                                        s.getEstado().name()
                                )
                                .orElse(null);

                SolicitudHistorialResponse dto =
                        new SolicitudHistorialResponse();

                dto.setIdSolicitud(s.getIdSolicitud());

                dto.setIdProveedor(
                        s.getProveedor().getIdProveedor()
                );

                dto.setNombreProveedor(
                        s.getProveedor().getRazonSocial()
                );

                dto.setTotal(s.getTotal());

                dto.setEstado(
                        formatearEstado(s.getEstado())
                );

                dto.setFechaCreacion(
                        s.getFechaCreacion()
                );

                dto.setDescripcionEstado(
                        historialActual != null
                                ? historialActual.getDescripcion()
                                : "Sin descripción"
                );

                dto.setFechaActualizacionEstado(
                        historialActual != null
                                ? historialActual.getFecha()
                                : s.getFechaCreacion()
                );

                return dto;

            }).toList();
}
}