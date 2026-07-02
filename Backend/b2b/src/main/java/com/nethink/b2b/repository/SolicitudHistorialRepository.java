package com.nethink.b2b.repository;

import com.nethink.b2b.entity.SolicitudHistorial;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.nethink.b2b.dto.response.TrackingStepEntregaResponse;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;

public interface SolicitudHistorialRepository
        extends JpaRepository<SolicitudHistorial, Integer> {

    List<SolicitudHistorial> findBySolicitud_IdSolicitudOrderByFechaAsc(
            Integer idSolicitud
    );

    Optional<SolicitudHistorial>
    findTopBySolicitud_IdSolicitudOrderByFechaDesc(
            Integer idSolicitud
    );

    Optional<SolicitudHistorial>
    findTopBySolicitud_IdSolicitudAndEstadoOrderByFechaDesc(
            Integer idSolicitud,
            String estado
    );
    
    
   @Query("""
SELECT new com.nethink.b2b.dto.response.TrackingStepEntregaResponse(

    sh.solicitud.idSolicitud,

    sh.estado,

    sh.descripcion,
          
    sh.fecha      

)

FROM SolicitudHistorial sh

WHERE sh.solicitud.idSolicitud = :idSolicitud
          AND sh.solicitud.proveedor.idProveedor = :idProveedor

ORDER BY sh.fecha ASC
""")
List<TrackingStepEntregaResponse>
listarTrackingSolicitud(
        @Param("idSolicitud")
        Integer idSolicitud,
        
        @Param("idProveedor")
        Integer idProveedor
        
        
        
        
); 
    
  

// cantidad de solicitudes creadas mensual  

@Query("""
SELECT COUNT(DISTINCT h.solicitud.idSolicitud)
FROM SolicitudHistorial h
WHERE h.solicitud.proveedor.idProveedor = :idProveedor       
AND h.estado = 'CREADA'
AND h.fecha >= :inicioMesActual
AND h.fecha < :finMesActual
AND NOT EXISTS (
    SELECT 1
    FROM SolicitudHistorial hc
    WHERE hc.solicitud.idSolicitud = h.solicitud.idSolicitud
    AND hc.estado = 'CANCELADA'
)
""")
Long contarSolicitudesMesActual(
        @Param("idProveedor") Integer idProveedor,
        @Param("inicioMesActual") LocalDateTime inicioMesActual,
        @Param("finMesActual") LocalDateTime finMesActual
        
        
);




// solicitudes creadas del mes anterior

@Query("""
SELECT COUNT(DISTINCT h.solicitud.idSolicitud)
FROM SolicitudHistorial h
WHERE h.solicitud.proveedor.idProveedor = :idProveedor       
AND h.estado = 'CREADA'
AND h.fecha >= :inicioMesAnterior
AND h.fecha < :finMesAnterior
AND NOT EXISTS (
    SELECT 1
    FROM SolicitudHistorial hc
    WHERE hc.solicitud.idSolicitud = h.solicitud.idSolicitud
    AND hc.estado = 'CANCELADA'
)
""")
Long contarSolicitudesMesAnterior(
        @Param("idProveedor") Integer idProveedor,
        @Param("inicioMesAnterior") LocalDateTime inicioMesAnterior,
        @Param("finMesAnterior") LocalDateTime finMesAnterior
        
);



// cantidad de solciitudes aceptadas en el mes actual y anterior

@Query("""
SELECT
    COALESCE(
        SUM(
            CASE
                WHEN h.fecha >= :inicioMesActual
                 AND h.fecha < :finMesActual
                THEN 1
                ELSE 0
            END
        ),
        0
    ),

    COALESCE(
        SUM(
            CASE
                WHEN h.fecha >= :inicioMesAnterior
                 AND h.fecha < :finMesAnterior
                THEN 1
                ELSE 0
            END
        ),
        0
    )

FROM SolicitudHistorial h
WHERE h.solicitud.proveedor.idProveedor = :idProveedor       

AND h.estado = 'PEDIDO_APROBADO'
AND h.fecha >= :inicioMesAnterior
AND h.fecha < :finMesActual
""")
Object[] obtenerSolicitudesAprobadasDashboard(
        @Param("idProveedor") Integer idProveedor,       
        @Param("inicioMesActual") LocalDateTime inicioMesActual,
        @Param("finMesActual") LocalDateTime finMesActual,
        @Param("inicioMesAnterior") LocalDateTime inicioMesAnterior,
        @Param("finMesAnterior") LocalDateTime finMesAnterior
);







 // consulta de cantidad de ingresos de mes actual  en función de solicitudes pagadas   
    
 
//@Query("""
//SELECT
//    COALESCE(
//        SUM(
//            CASE
//                WHEN s.fechaCreacion >= :inicioMesActual
//                 AND s.fechaCreacion < :finMesActual
//                THEN s.total
//                ELSE 0
//            END
//        ),
//        0
//    ),
//
//    COALESCE(
//        SUM(
//            CASE
//                WHEN s.fechaCreacion >= :inicioMesAnterior
//                 AND s.fechaCreacion < :finMesAnterior
//                THEN s.total
//                ELSE 0
//            END
//        ),
//        0
//    )
//
//FROM Solicitud s
//
//WHERE EXISTS (
//
//    SELECT 1
//    FROM SolicitudHistorial h
//    WHERE h.solicitud.idSolicitud = s.idSolicitud
//    AND h.estado = 'PAGADA'
//
//)
//
//AND s.fechaCreacion >= :inicioMesAnterior
//AND s.fechaCreacion < :finMesActual
//""")
//Object[] obtenerIngresosDashboard(
//        @Param("inicioMesActual") LocalDateTime inicioMesActual,
//        @Param("finMesActual") LocalDateTime finMesActual,
//        @Param("inicioMesAnterior") LocalDateTime inicioMesAnterior,
//        @Param("finMesAnterior") LocalDateTime finMesAnterior
//);

















 







    
}