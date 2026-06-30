package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.SolicitudCrearRequest;
import com.nethink.b2b.dto.response.SolicitudHistorialResponse;
import com.nethink.b2b.dto.response.SolicitudResponse;
import com.nethink.b2b.dto.response.TrackingResponse;
import com.nethink.b2b.dto.response.TrackingStepEntregaResponse; 
import com.nethink.b2b.dto.response.TrackingStepResponse;
import com.nethink.b2b.entity.DescuentoVolumen;
import com.nethink.b2b.entity.DetalleSolicitud;
import com.nethink.b2b.entity.EmpresaCompradora;
import com.nethink.b2b.entity.InventarioReserva;
import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.entity.Solicitud.EstadoSolicitud;
import com.nethink.b2b.entity.SolicitudHistorial;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.DescuentoVolumenRepository;
import com.nethink.b2b.repository.DetalleSolicitudRepository;
import com.nethink.b2b.repository.EmpresaCompradoraRepository;
import com.nethink.b2b.repository.InventarioReservaRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import com.nethink.b2b.repository.ProveedorRepository;
import com.nethink.b2b.repository.SolicitudHistorialRepository;
import com.nethink.b2b.repository.SolicitudRepository;
import com.nethink.b2b.repository.UsuarioRepository;

//se añadio esto val
import com.nethink.b2b.dto.response.SolicitudResponse;
import com.nethink.b2b.dto.response.DetalleSolicitudResponse;
import com.nethink.b2b.dto.response.EspecificacionResponse;
import com.nethink.b2b.entity.ProductoEspecificacion;
import com.nethink.b2b.repository.ProductoEspecificacionRepository; 
import jakarta.servlet.http.HttpServletRequest;
import com.nethink.b2b.dto.response.SolicitudEntregaResponse; 
import com.nethink.b2b.dto.response.SolicitudDetalleEntregaResponse; 


import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// se añadio esto val
import java.util.ArrayList; 


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SolicitudService {

    private final SolicitudRepository solicitudRepo;
    private final DetalleSolicitudRepository detalleRepo;
    private final ProveedorProductoRepository provProdRepo;
    private final UsuarioRepository usuarioRepo;
    private final ProveedorRepository proveedorRepo;
    private final EmpresaCompradoraRepository empresaRepo;
    private final SolicitudHistorialRepository historialRepo;
    private final EmailService emailService;
    private final LogsSistemaService logsSistemaService;
    private final InventarioReservaService reservaService;
    private final InventarioReservaRepository reservaRepo;
    private final DescuentoVolumenRepository descuentoVolumenRepo;
    
    private final ProductoEspecificacionRepository especificacionRepo; 
     

    public SolicitudService(
            SolicitudRepository solicitudRepo,
            DetalleSolicitudRepository detalleRepo,
            
            ProveedorProductoRepository provProdRepo,
            UsuarioRepository usuarioRepo,
            ProveedorRepository proveedorRepo,
            EmpresaCompradoraRepository empresaRepo,
            SolicitudHistorialRepository historialRepo,
            EmailService emailService,
            InventarioReservaService reservaService,
            LogsSistemaService logsSistemaService,
            InventarioReservaRepository reservaRepo,
            DescuentoVolumenRepository descuentoVolumenRepo,
            ProductoEspecificacionRepository especificaRepo 
    ) {
        this.solicitudRepo = solicitudRepo;
        this.detalleRepo = detalleRepo;
        this.provProdRepo = provProdRepo;
        this.usuarioRepo = usuarioRepo;
        this.proveedorRepo = proveedorRepo;
        this.empresaRepo = empresaRepo;
        this.historialRepo = historialRepo;
        this.emailService = emailService;
        this.logsSistemaService = logsSistemaService;
        this.reservaService=reservaService;
        this.reservaRepo= reservaRepo;
        this.descuentoVolumenRepo= descuentoVolumenRepo;
        this.especificacionRepo=especificaRepo; 
    }

    @Transactional
    public Solicitud crearSolicitud(
            SolicitudCrearRequest request,
            String correoCliente,
            HttpServletRequest req
    ) {

        Usuario cliente = usuarioRepo.findByCorreo(correoCliente)
                .orElseThrow();

        Proveedor proveedor = proveedorRepo.findById(request.idProveedor())
                .orElseThrow();

        EmpresaCompradora empresa = null;

        if (request.idEmpresa() != null) {
            
            

            empresa = empresaRepo.findById(request.idEmpresa())
                    .orElseThrow(() ->
                            new RuntimeException("Empresa no encontrada"));
        }

        Solicitud sol = new Solicitud();

        sol.setUsuario(cliente);
        sol.setEmpresaCompradora(empresa);
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

ProveedorProducto pp = provProdRepo
        .buscarPorProveedorYProducto(
                request.idProveedor(),
                itemReq.idProducto()
        ).orElseThrow();


int cantidadReq = itemReq.cantidad();

int disponible = reservaService.calcularStockDisponible(pp);

if (disponible < cantidadReq) {
    logsSistemaService.registrarLog(
    cliente.getIdUsuario(),
    "STOCK_INSUFICIENTE",
    "SOLICITUDES",
    "Stock insuficiente para producto: "
        + pp.getProducto().getNombre(),
    req
);
    throw new RuntimeException("Stock insuficiente para producto: " + pp.getProducto().getNombre());
}



provProdRepo.save(pp);


reservaService.crearReserva(
        guardada,
        pp,
        cantidadReq
);
            BigDecimal cantidad =
                    BigDecimal.valueOf(itemReq.cantidad());

          double precioBase = pp.getPrecio().doubleValue();
double precioFinal = precioBase;

/* volumen */
List<DescuentoVolumen> volumenes =
        descuentoVolumenRepo.findByProveedorProducto_IdProvProd(pp.getIdProvProd());

DescuentoVolumen mejor = volumenes.stream()
        .filter(v -> cantidadReq >= v.getCantidadMin())
        .max(Comparator.comparingInt(DescuentoVolumen::getCantidadMin))
        .orElse(null);

if (mejor != null) {
    precioFinal = mejor.getPrecioUnitario().doubleValue();
} else {
    if (pp.getPorcentajeDescuento() != null && pp.getPorcentajeDescuento() > 0) {
        precioFinal -= precioBase * pp.getPorcentajeDescuento() / 100;
    }
}

BigDecimal totalItem =
        BigDecimal.valueOf(precioFinal)
                .multiply(BigDecimal.valueOf(cantidadReq));

            total = total.add(totalItem);

            if (
                    pp.getTiempoEntregaDias() != null &&
                    pp.getTiempoEntregaDias() > maxDiasEntrega
            ) {
                maxDiasEntrega =
                        pp.getTiempoEntregaDias();
            }

            DetalleSolicitud detalle =
                    new DetalleSolicitud();

            detalle.setSolicitud(guardada);

            detalle.setProveedorProducto(pp);

            detalle.setCantidad(itemReq.cantidad());

           detalle.setPrecioUnitario(BigDecimal.valueOf(precioFinal));

            detalle.setTiempoEntregaDias(
                    pp.getTiempoEntregaDias()
            );

            detalle.setGarantiaMeses(
                    pp.getGarantiaMeses()
            );

            detalleRepo.save(detalle);
        }

        total = total.setScale(
                2,
                RoundingMode.HALF_UP
        );

        BigDecimal subtotal = total.divide(
                BigDecimal.valueOf(1.18),
                2,
                RoundingMode.HALF_UP
        );

        BigDecimal igv = total.subtract(subtotal)
                .setScale(2, RoundingMode.HALF_UP);

        guardada.setSubtotal(subtotal);
        guardada.setIgv(igv);
        guardada.setTotal(total);

        LocalDateTime fechaEntrega =
                ahora.plusDays(maxDiasEntrega);

        guardada.setFechaLimiteEntrega(
                fechaEntrega
        );

        guardada.setFechaEntrega(
                fechaEntrega
        );

        Solicitud finalizada =
                solicitudRepo.save(guardada);
        
        logsSistemaService.registrarLog(
    cliente.getIdUsuario(),
    "CREAR_SOLICITUD",
    "SOLICITUDES",
    "Solicitud creada ID: "
        + finalizada.getIdSolicitud()
        + " | Total: "
        + finalizada.getTotal(),
    req
);

        SolicitudHistorial historial =
                new SolicitudHistorial();

        historial.setSolicitud(finalizada);

        historial.setEstado(
                EstadoSolicitud.CREADA.name()
        );

        historial.setIdUsuario(
                cliente.getIdUsuario()
        );

        historial.setDescripcion(
                "Solicitud registrada correctamente"
        );

        historial.setFecha(LocalDateTime.now());

        historialRepo.save(historial);

        try {

            emailService.enviarCorreoCliente(
                    finalizada
            );

            emailService.enviarCorreoProveedor(
                    finalizada
            );

        } catch (Exception e) {

            
            logsSistemaService.registrarLog(
    cliente.getIdUsuario(),
    "EMAIL_ERROR",
    "EMAIL",
    e.getMessage(),
   req
);
            e.printStackTrace();
        }

        return finalizada;
    }

    public List<SolicitudResponse> listarMisSolicitudes(
            Integer idUsuario
    ) {

        List<Solicitud> solicitudes =
                solicitudRepo.findByUsuarioOptimized(idUsuario);

        return solicitudes.stream().map(s -> {

            SolicitudResponse dto =
                    new SolicitudResponse();

            dto.setIdSolicitud(
                    s.getIdSolicitud()
            );

            dto.setIdProveedor(
                    s.getProveedor().getIdProveedor()
            );

            dto.setNombreProveedor(
                    s.getProveedor().getRazonSocial()
            );

            dto.setIdEmpresa(
                    s.getEmpresaCompradora() != null
                            ? s.getEmpresaCompradora().getIdEmpresa()
                            : null
            );

            dto.setNombreEmpresa(
                    s.getEmpresaCompradora() != null
                            ? s.getEmpresaCompradora().getRazonSocial()
                            : "Compra independiente"
            );

            dto.setRucEmpresa(
                    s.getEmpresaCompradora() != null
                            ? s.getEmpresaCompradora().getRuc()
                            : null
            );

            dto.setTotal(
                    s.getTotal()
            );

            dto.setEstado(
                    formatearEstado(s.getEstado())
            );
            
            dto.setDireccionEnvio(s.getDireccionEnvio());

            dto.setFechaCreacion(
                    s.getFechaCreacion()
            );

            return dto;

        }).collect(Collectors.toList());
    }

    public TrackingResponse obtenerTracking(
            Integer idSolicitud,
            Integer idUsuario,
            HttpServletRequest request
    ) {
        
        logsSistemaService.registrarLog(
    idUsuario,
    "TRACKING",
    "SOLICITUDES",
    "Consulta tracking solicitud ID: "
        + idSolicitud,
    request
);

        Solicitud s = solicitudRepo.buscarTracking(idSolicitud)
                .orElseThrow();

        TrackingResponse r =
                new TrackingResponse();
        r.setEmpresaCompradora(s.getEmpresaCompradora());

        r.setIdSolicitud(
                s.getIdSolicitud()
        );

        r.setIdProveedor(
                s.getProveedor().getIdProveedor()
        );

        r.setProveedor(
                s.getProveedor().getRazonSocial()
        );

        r.setEstado(
                formatearEstado(s.getEstado())
        );

        r.setTotal(
                s.getTotal()
        );

        r.setDireccion(
                s.getDireccionEnvio()
        );

        r.setCodigoRecepcion(
                s.getCodigoRecepcion()
        );

        r.setFechaEntrega(
                s.getFechaEntrega()
        );
        
        r.setFechaLimiteEntrega(s.getFechaLimiteEntrega());

        List<SolicitudHistorial> historiales =
                historialRepo
                        .findBySolicitud_IdSolicitudOrderByFechaAsc(
                                idSolicitud
                        );

        List<TrackingStepResponse> timeline =
                historiales.stream()
                        .map(h -> {

                            TrackingStepResponse step =
                                    new TrackingStepResponse();

                            step.setEstado(
                                    formatearEstado(
                                            EstadoSolicitud.valueOf(
                                                    h.getEstado()
                                            )
                                    )
                            );

                            step.setDescripcion(
                                    h.getDescripcion()
                            );

                            step.setFecha(
                                    h.getFecha()
                            );

                            return step;

                        }).collect(Collectors.toList());

        r.setTimeline(timeline);

        return r;
    }

    public Map<String, String> cancelarSolicitud(
            Integer idSolicitud,
            String correoUsuario,
            HttpServletRequest request
    ) {

        Solicitud solicitud =
                solicitudRepo.findById(idSolicitud)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Solicitud no encontrada"
                                )
                        );

        Usuario usuario =
                usuarioRepo.findByCorreo(correoUsuario)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Usuario no encontrado"
                                )
                        );

        solicitud.setEstado(
                EstadoSolicitud.CANCELADA
        );

        solicitudRepo.save(solicitud);
        
        logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "CANCELAR_SOLICITUD",
    "SOLICITUDES",
    "Solicitud cancelada ID: "
        + solicitud.getIdSolicitud(),
    request
);
        
         List<InventarioReserva> reservas =
            reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);

  
    for (InventarioReserva r : reservas) {

       
        r.setEstado("CANCELADO");
        r.setFechaActualizacion(LocalDateTime.now());

        reservaRepo.save(r);
    }

        SolicitudHistorial historial =
                new SolicitudHistorial();

        historial.setSolicitud(solicitud);

        historial.setIdUsuario(
                usuario.getIdUsuario()
        );

        historial.setEstado(
                EstadoSolicitud.CANCELADA.name()
        );

        historial.setDescripcion(
                "Solicitud cancelada por el usuario"
        );

        historial.setFecha(
                LocalDateTime.now()
        );

        historialRepo.save(historial);

        return Map.of(
                "message",
                "Solicitud cancelada correctamente"
        );
    }

    private String generarCodigoRecepcion() {

        String chars =
                "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        String codigo;

        do {

            StringBuilder sb =
                    new StringBuilder("NP");

            for (int i = 0; i < 6; i++) {

                int idx = (int)
                        (Math.random() * chars.length());

                sb.append(
                        chars.charAt(idx)
                );
            }

            codigo = sb.toString();

        } while (
                solicitudRepo.existsByCodigoRecepcion(codigo)
        );

        return codigo;
    }

        // Enviar correo solicitando evaluación al cliente
        public void notifyEvaluation(Integer idSolicitud) {
                Solicitud s = solicitudRepo.findById(idSolicitud)
                                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

                try {
                        emailService.enviarCorreoEvaluacionCliente(s);
                } catch (Exception e) {
                        System.out.println("notifyEvaluation error: " + e.getMessage());
                }
        }

        // Marcar como completada si no hubo respuesta
        public void autoCompleteIfUnresolved(Integer idSolicitud) {
                Solicitud s = solicitudRepo.findById(idSolicitud)
                                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

                if (s.getEstado() == EstadoSolicitud.ENTREGADA) {
                        s.setEstado(EstadoSolicitud.COMPLETADA);
                        solicitudRepo.save(s);

                        SolicitudHistorial historial = new SolicitudHistorial();
                        historial.setSolicitud(s);
                        historial.setIdUsuario(s.getUsuario() != null ? s.getUsuario().getIdUsuario() : null);
                        historial.setEstado(EstadoSolicitud.COMPLETADA.name());
                        historial.setDescripcion("Solicitud marcada como completada automáticamente por falta de evaluación");
                        historial.setFecha(LocalDateTime.now());
                        historialRepo.save(historial);
                }
        }

        // Resolver evaluación enviada por cliente (marca completada)
        public void resolveEvaluation(Integer idSolicitud) {
                Solicitud s = solicitudRepo.findById(idSolicitud)
                                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

                s.setEstado(EstadoSolicitud.COMPLETADA);
                solicitudRepo.save(s);

                SolicitudHistorial historial = new SolicitudHistorial();
                historial.setSolicitud(s);
                historial.setIdUsuario(s.getUsuario() != null ? s.getUsuario().getIdUsuario() : null);
                historial.setEstado(EstadoSolicitud.COMPLETADA.name());
                historial.setDescripcion("Evaluación recibida y solicitud marcada como completada");
                historial.setFecha(LocalDateTime.now());
                historialRepo.save(historial);
        }

        // Registrar reclamo por demora y notificar al proveedor
        public void enviarReclamoDemora(Integer idSolicitud, String descripcion, String evidenciaJson) {
                Solicitud s = solicitudRepo.findById(idSolicitud)
                                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

                SolicitudHistorial historial = new SolicitudHistorial();
                historial.setSolicitud(s);
                historial.setIdUsuario(s.getUsuario() != null ? s.getUsuario().getIdUsuario() : null);
                historial.setEstado(EstadoSolicitud.EN_RECLAMO.name());
                historial.setDescripcion("Reclamo por demora: " + (descripcion != null ? descripcion : ""));
                historial.setFecha(LocalDateTime.now());
                historialRepo.save(historial);

                s.setEstado(EstadoSolicitud.EN_RECLAMO);
                solicitudRepo.save(s);

                try {
                        emailService.enviarCorreoReclamoDemora(s, descripcion, evidenciaJson);
                } catch (Exception e) {
                        System.out.println("enviarReclamoDemora email error: " + e.getMessage());
                }
        }

    private String formatearEstado(
            EstadoSolicitud estado
    ) {

        return switch (estado) {

            case CREADA -> "Creada";

            case PAGO_PENDIENTE -> "Pago pendiente";
                
            case PEDIDO_APROBADO -> "Pedido aprobado";

            case PAGO_VALIDANDO -> "Validando pago";
                
            case PAGADA -> "Pagado" ;
            
            case EN_PREPARACION -> "En preparación";

            case EN_CAMINO -> "En camino";
                
            case  EN_RECLAMO -> "En reclamo";

            case ENTREGADA -> "Entregado";

            case CANCELADA -> "Cancelada";

            default -> throw new IllegalStateException(
                    "Unexpected value: " + estado
            );
        };
    }

    public List<SolicitudHistorialResponse> listarHistorial(
            Integer idUsuario
    ) {

        List<Solicitud> solicitudes =
                solicitudRepo.findByUsuarioOptimized(idUsuario);

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

                    dto.setIdSolicitud(
                            s.getIdSolicitud()
                    );

                    dto.setIdProveedor(
                            s.getProveedor().getIdProveedor()
                    );

                    dto.setNombreProveedor(
                            s.getProveedor().getRazonSocial()
                    );

                    dto.setTotal(
                            s.getTotal()
                    );

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
    
    
    
    // se añadio lista de solicitudes que tienen los proveedores
    
    
    
    public List<SolicitudResponse> listarSolicitudesProveedor(

        Integer idProveedor,Integer idUsuario, HttpServletRequest request) {
        
        logsSistemaService.registrarLog(
    idUsuario,
    "LISTAR_SOLICITUDES_PROVEEDOR",
    "PROVEEDORES",
    "Consulta solicitudes proveedor ID: "
        + idProveedor,
   request
);


System.err.println("ID PROVEEDOR = " + idProveedor);

    List<Solicitud> solicitudes =
            solicitudRepo.listarSolicitudes(idProveedor);

    List<SolicitudResponse> response =
            new ArrayList<>();

    for (Solicitud s : solicitudes) {

        SolicitudResponse dto =
                new SolicitudResponse();

        // =====================================
        // DATOS SOLICITUD
        // =====================================

        dto.setIdSolicitud(
                s.getIdSolicitud());

        dto.setTotal(
                s.getTotal());

        dto.setEstado(
                s.getEstado().name());

        dto.setFechaCreacion(
                s.getFechaCreacion());

        // =====================================
        // DATOS PROVEEDOR
        // =====================================

        dto.setIdProveedor(
                s.getProveedor()
                 .getIdProveedor());

        dto.setNombreProveedor(
                s.getProveedor()
                 .getRazonSocial());
        
        dto.setDireccionEnvio(s.getDireccionEnvio());

        // =====================================
        // DATOS EMPRESA
        // =====================================

        if (s.getEmpresaCompradora() != null) {
    dto.setIdEmpresa(s.getEmpresaCompradora().getIdEmpresa());
    dto.setNombreEmpresa(s.getEmpresaCompradora().getRazonSocial());
    dto.setRucEmpresa(s.getEmpresaCompradora().getRuc());
}

        // =====================================
        // DATOS CLIENTE
        // =====================================

        if (s.getUsuario() != null) {
    dto.setNombreCliente(
            s.getUsuario().getNombres()
            + " "
            + s.getUsuario().getApellidos()
    );
    dto.setCorreoCliente(s.getUsuario().getCorreo());
    dto.setTelefonoCliente(
        s.getUsuario().getTelefono());
}

        // =====================================
        // DETALLES
        // =====================================

        List<DetalleSolicitud> detalles =
                detalleRepo.listarDetalles(
                        s.getIdSolicitud());

        List<DetalleSolicitudResponse> detalleDTOs =
                new ArrayList<>();

        for (DetalleSolicitud d : detalles) {

            DetalleSolicitudResponse det =
                    new DetalleSolicitudResponse();

            det.setCantidad(
                    d.getCantidad());

            det.setNombreProducto(
                    d.getProveedorProducto()
                     .getProducto()
                     .getNombre());

            det.setCategoria(
                    d.getProveedorProducto()
                     .getProducto()
                     .getCategoria()
                     .getNombre());
            
            det.setMarca(
                    d.getProveedorProducto()
                      .getProducto()
                      .getMarca() != null
                       ? d.getProveedorProducto().getProducto().getMarca().getNombre()
                       : null
                        );
            

            
            
            Integer idProducto =
        d.getProveedorProducto().getProducto().getIdProducto();

    List<ProductoEspecificacion> specs =
        especificacionRepo.listarPorProducto(idProducto);

    List<EspecificacionResponse> specsResponse = new ArrayList<>();

    for (ProductoEspecificacion pe : specs) {

        EspecificacionResponse especi = new EspecificacionResponse();
        especi.setNombre(pe.getNombre());
        especi.setValor(pe.getValor());

        specsResponse.add(especi);
        
    }
            
            
           det.setEspecificaciones(specsResponse);       
            
            
            
            
            detalleDTOs.add(det);
        }

        dto.setDetalles(
        detalleDTOs != null ? detalleDTOs : new ArrayList<>()
);

        response.add(dto);
    }

    return response;
}
    
    
    
// listar solicitudes pagadas, en preparacion, en camino y entregadas
    
    
    public List<SolicitudEntregaResponse>
listarSolicitudesEntregaProveedor(
        Integer idProveedor
) {

    return solicitudRepo
            .listarSolicitudesEntrega(
                    idProveedor
            );

}
    
    public List<SolicitudResponse> listarTodasSolicitudes(Integer idUsuario,HttpServletRequest request) {
logsSistemaService.registrarLog(
    idUsuario,
    "LISTAR_SOLICITUDES",
    "ADMIN",
    "Consulta global de solicitudes",
    request
);
    List<Solicitud> solicitudes =
            solicitudRepo.findAll();

    List<SolicitudResponse> response =
            new ArrayList<>();

    for (Solicitud s : solicitudes) {

        SolicitudResponse dto =
                new SolicitudResponse();

        dto.setIdSolicitud(
                s.getIdSolicitud()
        );

        dto.setIdProveedor(
                s.getProveedor()
                 .getIdProveedor()
        );

        dto.setNombreProveedor(
                s.getProveedor()
                 .getRazonSocial()
        );

        if (s.getEmpresaCompradora() != null) {

            dto.setIdEmpresa(
                    s.getEmpresaCompradora()
                     .getIdEmpresa()
            );

            dto.setNombreEmpresa(
                    s.getEmpresaCompradora()
                     .getRazonSocial()
            );

            dto.setRucEmpresa(
                    s.getEmpresaCompradora()
                     .getRuc()
            );
        }

        if (s.getUsuario() != null) {

            dto.setNombreCliente(
                    s.getUsuario().getNombres()
                    + " "
                    + s.getUsuario().getApellidos()
            );

            dto.setCorreoCliente(
                    s.getUsuario()
                     .getCorreo()
            );

            dto.setTelefonoCliente(
                    s.getUsuario()
                     .getTelefono()
            );
        }

        dto.setTotal(
                s.getTotal()
        );

        dto.setEstado(
                s.getEstado().name()
        );
        dto.setDireccionEnvio(s.getDireccionEnvio());
        dto.setFechaCreacion(
                s.getFechaCreacion()
        );

        response.add(dto);
    }

    return response;
}
    
  // listar el tracking para proveedor

public List<TrackingStepEntregaResponse>
listarTrackingSolicitud(

        Integer idSolicitud,

        Integer idProveedor

) {

    return historialRepo
            .listarTrackingSolicitud(

                    idSolicitud,

                    idProveedor

            );

}
    
        @Transactional
public void aprobarPedido(Integer idSolicitud, String correoUsuario,HttpServletRequest req) {

   Solicitud sol = solicitudRepo.findById(idSolicitud)
            .orElseThrow(() ->
                    new RuntimeException("Solicitud no encontrada"));
         Usuario usuario = usuarioRepo.findByCorreo(correoUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));


    sol.setEstado(
          Solicitud.EstadoSolicitud.PEDIDO_APROBADO
    );

   sol = solicitudRepo.save(sol);

  
    

    logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "APROBAR PEDIDOS",
    "PROVEEDORES",
    "Pedido Aprobado ID: "
        + sol.getIdSolicitud()
     ,
    req
);
    
        SolicitudHistorial historial = new SolicitudHistorial();
        historial.setSolicitud(sol);
        historial.setEstado("PEDIDO_APROBADO");
        historial.setIdUsuario(usuario.getIdUsuario());
        historial.setDescripcion("Pedido aprobado");
        historial.setFecha(LocalDateTime.now());

        historialRepo.save(historial);

}
  

  // listar los detalles de las solicitudes que estan en fase de entregas


public List<SolicitudDetalleEntregaResponse>
listarDetallesEntregaProveedor(

        Integer idProveedor,
        Integer idSolicitud

) {

    return detalleRepo
            .listarDetallesEntregaProveedor(
                    idProveedor,
                    idSolicitud
            );

}





    
            @Transactional
public void rechazarPedido(Integer idSolicitud,String prompt, String correoUsuario,HttpServletRequest req) {

   Solicitud sol = solicitudRepo.findById(idSolicitud)
            .orElseThrow(() ->
                    new RuntimeException("Solicitud no encontrada"));
         Usuario usuario = usuarioRepo.findByCorreo(correoUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));


    sol.setEstado(
          Solicitud.EstadoSolicitud.CANCELADA
    );
    
    sol.setFechaCancelacion(LocalDateTime.now());

   sol = solicitudRepo.save(sol);

  
    
    logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "RECHAZAR PEDIDOS",
    "PROVEEDORES",
    "Pedido Rechazado ID: "
        + sol.getIdSolicitud()
     ,
    req
);
    
        SolicitudHistorial historial = new SolicitudHistorial();
        historial.setSolicitud(sol);
        historial.setEstado("CANCELADA");
        historial.setIdUsuario(usuario.getIdUsuario());
        historial.setDescripcion("Pedido rechazado por:"+prompt);
        historial.setFecha(LocalDateTime.now());

        historialRepo.save(historial);

}
    
  



@Transactional
public void actualizarEstado(Integer idSolicitud, EstadoSolicitud nuevoEstado, String codigoIngresado,
        String correoUsuario     ) {

    
    
    
    // =========================
        // 1. BUSCAR SOLICITUD
        // =========================
        Solicitud solicitud = solicitudRepo.findById(idSolicitud)
                .orElseThrow(() ->
                        new RuntimeException("Solicitud no encontrada")
                );

        // =========================
        // 2. BUSCAR USUARIO AUTENTICADO
        // =========================
        //Usuario usuario = usuarioRepo.findByCorreo(correoUsuario)
        //        .orElseThrow(() ->
        //                new RuntimeException("Usuario no encontrado")
        //        );
    
    
    // =========================
    // 3. VALIDACIÓN DE CÓDIGO SOLO SI ES ENTREGADA
    // =========================
    if (nuevoEstado == EstadoSolicitud.ENTREGADA) {

        if (codigoIngresado == null || codigoIngresado.isEmpty()) {
            throw new RuntimeException("Código requerido para marcar como ENTREGADA");
        }

        if (!codigoIngresado.equals(solicitud.getCodigoRecepcion())) {
            throw new RuntimeException("Código incorrecto");
        }
        
        solicitud.setFechaEntrega(LocalDateTime.now());
        emailService.enviarCorreoEvaluacionCliente(solicitud);
    }
    

    // 1. actualizar estado
    solicitud.setEstado(nuevoEstado);

    solicitudRepo.save(solicitud);
    
    String descripcion = generarDescripcion(nuevoEstado);

    // 2. guardar historial
    SolicitudHistorial hist = new SolicitudHistorial();
    hist.setSolicitud(solicitud);
    hist.setEstado(nuevoEstado.name());
    hist.setDescripcion(descripcion); 
    hist.setFecha(LocalDateTime.now());

    historialRepo.save(hist);
}



private String generarDescripcion(EstadoSolicitud estado) {

    switch (estado) {

        case EN_PREPARACION:
            return "El pedido está siendo preparado para despacho";

        case EN_CAMINO:
            return "El pedido está en camino";

        case ENTREGADA:
            return "El pedido fue entregado al cliente";

        

        default:
            return "Estado actualizado";
    }
}











}