package com.nethink.b2b.service;

import com.nethink.b2b.entity.*;
import com.nethink.b2b.repository.InventarioReservaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InventarioReservaService {

    private final InventarioReservaRepository reservaRepo;

    public InventarioReservaService(InventarioReservaRepository reservaRepo) {
        this.reservaRepo = reservaRepo;
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

    public void confirmarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);

        for (InventarioReserva r : reservas) {
            r.setEstado("CONFIRMADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);
        }
    }

    public void liberarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);

        for (InventarioReserva r : reservas) {
            r.setEstado("LIBERADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);
        }
    }
}