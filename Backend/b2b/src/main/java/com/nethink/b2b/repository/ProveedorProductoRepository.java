package com.nethink.b2b.repository;

import com.nethink.b2b.entity.ProveedorProducto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProveedorProductoRepository 
        extends JpaRepository<ProveedorProducto, Integer> {

    @Query("SELECT pp FROM ProveedorProducto pp WHERE pp.proveedor.idProveedor = :idProveedor AND pp.producto.idProducto = :idProducto")
    Optional<ProveedorProducto> buscarPorProveedorYProducto(
            @Param("idProveedor") Integer idProveedor, 
            @Param("idProducto") Integer idProducto
    );

    @Query(value = """
        SELECT pp.id_proveedor
        FROM proveedor_producto pp
        JOIN productos p ON pp.id_producto = p.id_producto
        WHERE pp.id_producto IN :productos
        AND pp.stock > 0
        AND pp.estado = 'ACTIVO'
        GROUP BY pp.id_proveedor
        HAVING COUNT(DISTINCT pp.id_producto) = :total
    """, nativeQuery = true)
    List<Integer> findProveedoresConTodosLosProductos(
            @Param("productos") List<Integer> productos,
            @Param("total") Integer total
    );

    @Query("SELECT pp FROM ProveedorProducto pp " +
           "WHERE pp.proveedor.idProveedor IN :proveedoresIds " +
           "AND pp.producto.idProducto IN :productosIds")
    List<ProveedorProducto> findDetallesParaScoring(
            @Param("proveedoresIds") List<Integer> proveedoresIds,
            @Param("productosIds") List<Integer> productosIds
    );
    

}
