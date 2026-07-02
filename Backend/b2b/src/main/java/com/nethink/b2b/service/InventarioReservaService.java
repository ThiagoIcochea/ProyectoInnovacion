package com.nethink.b2b.service;

import com.nethink.b2b.entity.*;
import com.nethink.b2b.repository.InventarioReservaRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InventarioReservaService {

    private final InventarioReservaRepository reservaRepo;
    private final ProveedorProductoRepository proveedorProductoRepo;

    public InventarioReservaService(
            InventarioReservaRepository reservaRepo,
            ProveedorProductoRepository proveedorProductoRepo
    ) {
        this.reservaRepo = reservaRepo;
        this.proveedorProductoRepo = proveedorProductoRepo;
    }

    public InventarioReserva crearReserva(
            Solicitud solicitud,
            ProveedorProducto pp,
            Integer cantidad
    ) {
        InventarioReserva r = new InventarioReserva();

        r.setSolicitud(solicitud);
        r.setProveedorProducto(pp);
        r.setCantidad(cantidad);
        r.setEstado("RESERVADO");
        r.setFechaCreacion(LocalDateTime.now());

        return reservaRepo.save(r);
    }

    @Transactional
    public void confirmarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);

        for (InventarioReserva r : reservas) {
            r.setEstado("CONFIRMADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);
        }
    }

    @Transactional
    public void liberarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);

        for (InventarioReserva r : reservas) {
            r.setEstado("LIBERADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);
        }
    }

    @Transactional
    public void entregarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);

        for (InventarioReserva r : reservas) {
            if (!esReservaActiva(r)) {
                continue;
            }

            ProveedorProducto pp = r.getProveedorProducto();
            int stockActual = pp.getStock() != null ? pp.getStock() : 0;
            int cantidad = r.getCantidad() != null ? r.getCantidad() : 0;

            pp.setStock(Math.max(0, stockActual - cantidad));
            pp.setUltimaActualizacionStock(LocalDateTime.now());
            proveedorProductoRepo.save(pp);

            r.setEstado("ENTREGADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);
        }
    }

    @Transactional
    public void cancelarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);

        reservaRepo.deleteAll(reservas);
    }
    
    public Integer calcularStockDisponible(ProveedorProducto pp) {

    int stockApi = pp.getStock(); 

    int reservado = reservaRepo.sumarReservasActivas(
            pp.getIdProvProd()
    );

    return stockApi - reservado;
}

private boolean esReservaActiva(InventarioReserva reserva) {
    if (reserva == null || reserva.getEstado() == null) {
        return false;
    }

    return "RESERVADO".equals(reserva.getEstado())
            || "CONFIRMADO".equals(reserva.getEstado());
}
}
