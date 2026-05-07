package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.SolicitudCrearRequest;
import com.nethink.b2b.dto.response.TrackingResponse;
import com.nethink.b2b.dto.response.TrackingStepResponse;
import com.nethink.b2b.entity.*;
import com.nethink.b2b.repository.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SolicitudService {

    private final SolicitudRepository solicitudRepo;
    private final DetalleSolicitudRepository detalleRepo;
    private final ProveedorProductoRepository provProdRepo;
    private final UsuarioRepository usuarioRepo;
    private final SolicitudHistorialRepository historialRepo;

    public SolicitudService(
            SolicitudRepository solicitudRepo,
            DetalleSolicitudRepository detalleRepo,
            ProveedorProductoRepository provProdRepo,
            UsuarioRepository usuarioRepo,
            SolicitudHistorialRepository historialRepo
    ) {
        this.solicitudRepo = solicitudRepo;
        this.detalleRepo = detalleRepo;
        this.provProdRepo = provProdRepo;
        this.usuarioRepo = usuarioRepo;
        this.historialRepo = historialRepo;
    }

    @Transactional
    public Solicitud crearSolicitud(
            SolicitudCrearRequest request,
            String correoCliente
    ) {

        Usuario cliente = usuarioRepo.findByCorreo(correoCliente)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Solicitud sol = new Solicitud();

        sol.setIdUsuario(cliente.getIdUsuario());
        sol.setIdProveedor(request.idProveedor());
        sol.setDireccionEnvio(request.direccionEnvio());
        sol.setEstado(Solicitud.EstadoSolicitud.PAGO_PENDIENTE);

        BigDecimal total = BigDecimal.ZERO;

        for (var itemReq : request.items()) {

            ProveedorProducto pp =
                    provProdRepo.buscarPorProveedorYProducto(
                            request.idProveedor(),
                            itemReq.idProducto()
                    ).orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            BigDecimal precioUnitario = pp.getPrecio();
            BigDecimal cantidad = BigDecimal.valueOf(itemReq.cantidad());

            BigDecimal precioTotalItem = precioUnitario.multiply(cantidad);

            total = total.add(precioTotalItem);
        }

        total = total.setScale(2, RoundingMode.HALF_UP);

        BigDecimal divisor = BigDecimal.valueOf(1.18);

        BigDecimal subtotal = total
                .divide(divisor, 2, RoundingMode.HALF_UP);

        BigDecimal igv = total
                .subtract(subtotal)
                .setScale(2, RoundingMode.HALF_UP);

        sol.setSubtotal(subtotal);
        sol.setIgv(igv);
        sol.setTotal(total);

        LocalDateTime ahora = LocalDateTime.now();

        sol.setFechaCreacion(ahora);
        sol.setCodigoUsado(false);
        sol.setCodigoRecepcion(generarCodigoRecepcion());

        int maxDiasEntrega = 0;

        for (var itemReq : request.items()) {

            ProveedorProducto pp =
                    provProdRepo.buscarPorProveedorYProducto(
                            request.idProveedor(),
                            itemReq.idProducto()
                    ).orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            if (pp.getTiempoEntregaDias() != null &&
                    pp.getTiempoEntregaDias() > maxDiasEntrega) {
                maxDiasEntrega = pp.getTiempoEntregaDias();
            }

            DetalleSolicitud detalle = new DetalleSolicitud();

            detalle.setSolicitud(sol);
            detalle.setProveedorProducto(pp);
            detalle.setCantidad(itemReq.cantidad());
            detalle.setPrecioUnitario(pp.getPrecio());
            detalle.setTiempoEntregaDias(pp.getTiempoEntregaDias());
            detalle.setGarantiaMeses(pp.getGarantiaMeses());

            detalleRepo.save(detalle);
        }

        LocalDateTime fechaEntrega = ahora.plusDays(maxDiasEntrega);

        sol.setFechaLimiteEntrega(fechaEntrega);
        sol.setFechaEntrega(fechaEntrega);

        Solicitud guardada = solicitudRepo.save(sol);

        SolicitudHistorial historial = new SolicitudHistorial();
        historial.setSolicitud(guardada);
        historial.setEstado("CREADA");
        historial.setDescripcion("Solicitud registrada correctamente");
        historial.setFecha(LocalDateTime.now());

        historialRepo.save(historial);

        return guardada;
    }

    private String generarCodigoRecepcion() {

        String caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        String codigo;

        do {
            StringBuilder sb = new StringBuilder("NP");

            for (int i = 0; i < 6; i++) {
                int index = (int) (Math.random() * caracteres.length());
                sb.append(caracteres.charAt(index));
            }

            codigo = sb.toString();

        } while (solicitudRepo.existsByCodigoRecepcion(codigo));

        return codigo;
    }

    public TrackingResponse obtenerTracking(Integer idSolicitud) {

        Solicitud solicitud = solicitudRepo.buscarTracking(idSolicitud)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        TrackingResponse response = new TrackingResponse();

        response.setIdSolicitud(solicitud.getIdSolicitud());
        response.setProveedor(solicitud.getProveedor() != null
                ? solicitud.getProveedor().getRazonSocial()
                : "Proveedor");

        response.setEstado(solicitud.getEstado() != null
                ? solicitud.getEstado().name()
                : "CREADA");

        response.setTotal(solicitud.getTotal());
        response.setDireccion(solicitud.getDireccionEnvio());
        response.setCodigoRecepcion(solicitud.getCodigoRecepcion());
        response.setFechaEntrega(solicitud.getFechaEntrega());

        List<TrackingStepResponse> timeline = new java.util.ArrayList<>();

        TrackingStepResponse step1 = new TrackingStepResponse();
        step1.setEstado("CREADA");
        step1.setDescripcion("Solicitud registrada correctamente");
        step1.setFecha(solicitud.getFechaCreacion());
        timeline.add(step1);

        response.setTimeline(timeline);

        return response;
    }
}