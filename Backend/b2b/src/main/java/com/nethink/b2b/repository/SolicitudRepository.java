package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Solicitud;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SolicitudRepository extends JpaRepository<Solicitud, Integer> {

@Query("""
SELECT s
FROM Solicitud s
LEFT JOIN FETCH s.proveedor p
WHERE s.usuario.id = :idUsuario
ORDER BY s.fechaCreacion DESC
""")
List<Solicitud> findByUsuarioOptimized(@Param("idUsuario") Integer idUsuario);

    @Query("""
        SELECT s
        FROM Solicitud s
        LEFT JOIN FETCH s.proveedor p
        WHERE s.idSolicitud = :idSolicitud
    """)
    Optional<Solicitud> buscarTracking(@Param("idSolicitud") Integer idSolicitud);
   boolean existsByCodigoRecepcion(String codigoRecepcion);
   
   @Modifying
@Query("""
update Solicitud s
set s.estado = :estado,
    s.direccionEnvio = :direccion
where s.idSolicitud = :id
""")
void actualizarPago(
        @Param("id") Integer id,
        @Param("estado") Solicitud.EstadoSolicitud estado,
        @Param("direccion") String direccion
);
}