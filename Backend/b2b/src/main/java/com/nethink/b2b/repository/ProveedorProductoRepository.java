package com.nethink.b2b.repository;

import com.nethink.b2b.entity.ProveedorProducto;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProveedorProductoRepository 
        extends JpaRepository<ProveedorProducto, Integer> {

    Optional<ProveedorProducto> findByProveedor_IdProveedorAndProducto_IdProducto(
            Integer idProveedor, 
            Integer idProducto
    );

   
    @Query(value = """
        SELECT pp.id_proveedor
        FROM proveedor_producto pp
        WHERE pp.id_producto IN :productos
        GROUP BY pp.id_proveedor
        HAVING COUNT(DISTINCT pp.id_producto) = :total
    """, nativeQuery = true)
    List<Integer> findProveedoresConTodosLosProductos(
            @Param("productos") List<Integer> productos,
            @Param("total") Integer total
    );
}