package com.nethink.b2b.repository;

import com.nethink.b2b.entity.ProveedorProducto;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProveedorProductoRepository extends JpaRepository<ProveedorProducto, Integer> {
    Optional<ProveedorProducto> findByProveedor_IdProveedorAndProducto_IdProducto(Integer idProveedor, Integer idProducto);
}