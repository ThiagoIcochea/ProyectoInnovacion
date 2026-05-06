package com.nethink.b2b.repository;

import com.nethink.b2b.entity.ProductoEspecificacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductoEspecificacionRepository extends JpaRepository<ProductoEspecificacion, Integer> {

    List<ProductoEspecificacion> findByProducto_IdProducto(Integer idProducto);
    List<ProductoEspecificacion> findByProducto_IdProductoIn(List<Integer> ids);
    void deleteByProducto_IdProducto(Integer idProducto);
    
}