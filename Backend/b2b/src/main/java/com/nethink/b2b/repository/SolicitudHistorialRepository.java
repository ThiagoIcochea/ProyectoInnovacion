package com.nethink.b2b.repository;

import com.nethink.b2b.entity.SolicitudHistorial;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SolicitudHistorialRepository
        extends JpaRepository<SolicitudHistorial, Integer> {

    List<SolicitudHistorial> findBySolicitud_IdSolicitudOrderByFechaAsc(
            Integer idSolicitud
    );

    Optional<SolicitudHistorial>
    findTopBySolicitud_IdSolicitudOrderByFechaDesc(
            Integer idSolicitud
    );

    Optional<SolicitudHistorial>
    findTopBySolicitud_IdSolicitudAndEstadoOrderByFechaDesc(
            Integer idSolicitud,
            String estado
    );
}