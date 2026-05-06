package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Comentario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComentarioRepository extends JpaRepository<Comentario, Integer> {

    // =========================
    // NEGATIVOS (OPTIMIZADO)
    // =========================
  @Query("""
    SELECT COUNT(c)
    FROM Comentario c
    WHERE c.tipo = 'NEGATIVO'
    AND c.idProvProd IN (
        SELECT pp.idProvProd
        FROM ProveedorProducto pp
        WHERE pp.proveedor.idProveedor = :idProveedor
    )
""")
Integer contarComentariosNegativos(@Param("idProveedor") Integer idProveedor);
 
@Query("""
    SELECT COUNT(c)
    FROM Comentario c
    WHERE c.tipo = 'POSITIVO'
    AND c.idProvProd IN (
        SELECT pp.idProvProd
        FROM ProveedorProducto pp
        WHERE pp.proveedor.idProveedor = :idProveedor
    )
""")
Integer contarComentariosPositivos(@Param("idProveedor") Integer idProveedor);
}