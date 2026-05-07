package com.nethink.b2b.repository;

import com.nethink.b2b.entity.SolicitudHistorial;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SolicitudHistorialRepository
        extends JpaRepository<SolicitudHistorial, Integer> {

    List<SolicitudHistorial> findBySolicitud_IdSolicitudOrderByFechaAsc(
            Integer idSolicitud
    );
}