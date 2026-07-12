package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Integer> {
    
    
  
    
    @Query("""
    SELECT DISTINCT p
    FROM Pago p
    JOIN FETCH p.solicitud s
    JOIN FETCH s.proveedor pr
    JOIN FETCH s.usuario u
    JOIN FETCH s.empresaCompradora ec
    WHERE pr.idProveedor = :idProveedor
""")
List<Pago> listarPagosProveedor(
        @Param("idProveedor") Integer idProveedor);
    
    
    
// suma de ingresos de solicitudes pagadas por cada mes para dashboard grafica   
  
@Query(value = """
SELECT
    YEAR(p.fecha_pago) AS anio,
    MONTH(p.fecha_pago) AS mes,
    SUM(p.monto) AS ingresos

FROM pagos p

INNER JOIN solicitudes s
    ON s.id_solicitud = p.id_solicitud

WHERE s.id_proveedor = :idProveedor
AND p.estado = 'APROBADO'
AND p.fecha_pago >= :fechaInicio
AND p.fecha_pago < :fechaFin

GROUP BY
    YEAR(p.fecha_pago),
    MONTH(p.fecha_pago)

ORDER BY
    YEAR(p.fecha_pago),
    MONTH(p.fecha_pago)
""", nativeQuery = true)
List<Object[]> obtenerIngresosUltimos12Meses(

        @Param("idProveedor") Integer idProveedor,

        @Param("fechaInicio") LocalDateTime fechaInicio,

        @Param("fechaFin") LocalDateTime fechaFin

);    
    
    
    
    
    
}
