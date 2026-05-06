package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.SolicitudCrearRequest;
import com.nethink.b2b.entity.*;
import com.nethink.b2b.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class SolicitudService {

    private final SolicitudRepository solicitudRepo;
    private final DetalleSolicitudRepository detalleRepo;
    private final ProveedorProductoRepository provProdRepo;
    private final UsuarioRepository usuarioRepo;

    public SolicitudService(SolicitudRepository solicitudRepo, 
                            DetalleSolicitudRepository detalleRepo,
                            ProveedorProductoRepository provProdRepo,
                            UsuarioRepository usuarioRepo) {
        this.solicitudRepo = solicitudRepo;
        this.detalleRepo = detalleRepo;
        this.provProdRepo = provProdRepo;
        this.usuarioRepo = usuarioRepo;
    }

    @Transactional
    public Solicitud crearSolicitud(SolicitudCrearRequest request, String correoCliente) {
        
        Usuario cliente = usuarioRepo.findByCorreo(correoCliente)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Solicitud sol = new Solicitud();
        sol.setIdUsuario(cliente.getIdUsuario());
        sol.setIdProveedor(request.idProveedor());
        sol.setDireccionEnvio(request.direccionEnvio());
        sol.setEstado(Solicitud.EstadoSolicitud.PAGO_PENDIENTE);
        
        sol.setSubtotal(BigDecimal.valueOf(request.subtotal()));
        sol.setIgv(BigDecimal.valueOf(request.igv()));
        sol.setTotal(BigDecimal.valueOf(request.total()));
        
        sol.setFechaCreacion(LocalDateTime.now());
        sol.setCodigoUsado(false);

        Solicitud guardada = solicitudRepo.save(sol);

        for (var itemReq : request.items()) {
            ProveedorProducto pp = provProdRepo.buscarPorProveedorYProducto(
                request.idProveedor(), itemReq.idProducto()
         
).orElseThrow(() -> new RuntimeException("Error: No existe el producto ID " + itemReq.idProducto() + 
                                         " para el proveedor ID " + request.idProveedor() + 
                                         " en la tabla proveedor_producto"));


            DetalleSolicitud detalle = new DetalleSolicitud();
            detalle.setSolicitud(guardada);
            detalle.setProveedorProducto(pp);
            detalle.setCantidad(itemReq.cantidad());
            detalle.setPrecioUnitario(itemReq.precioUnitario());
            detalle.setTiempoEntregaDias(pp.getTiempoEntregaDias());
            detalle.setGarantiaMeses(pp.getGarantiaMeses());

            detalleRepo.save(detalle);
        }

        return guardada;
    }
}
