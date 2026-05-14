package com.nethink.b2b.repository;

import com.nethink.b2b.entity.InventarioReserva;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventarioReservaRepository extends JpaRepository<InventarioReserva, Integer> {

    List<InventarioReserva> findBySolicitud_IdSolicitud(Integer idSolicitud);

    List<InventarioReserva> findByProveedorProducto_IdProvProd(Integer idProvProd);
}