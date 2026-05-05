package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Comentario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ComentarioRepository extends JpaRepository<Comentario, Integer> {

    @Query("""
        SELECT COUNT(c)
        FROM Comentario c
        WHERE c.idProvProd IN (
            SELECT pp.idProvProd
            FROM ProveedorProducto pp
            WHERE pp.idProveedor = :idProveedor
        )
        AND c.tipo = 'NEGATIVO'
    """)
    Integer contarComentariosNegativos(Integer idProveedor);

    @Query("""
        SELECT COUNT(c)
        FROM Comentario c
        WHERE c.idProvProd IN (
            SELECT pp.idProvProd
            FROM ProveedorProducto pp
            WHERE pp.idProveedor = :idProveedor
        )
        AND c.tipo = 'POSITIVO'
    """)
    Integer contarComentariosPositivos(Integer idProveedor);
}