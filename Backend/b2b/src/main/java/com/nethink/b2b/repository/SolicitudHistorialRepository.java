package com.nethink.b2b.repository;

import com.nethink.b2b.entity.SolicitudHistorial;
import com.nethink.b2b.entity.Solicitud;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.nethink.b2b.dto.response.TrackingStepEntregaResponse;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import com.nethink.b2b.dto.response.ClienteSolicitudesMensualesResponse;
import com.nethink.b2b.dto.response.ClienteProductoSolicitadoResponse;
import com.nethink.b2b.dto.response.ClienteAprobadasIndicadorResponse; 
import com.nethink.b2b.dto.response.ClienteMontoAprobadoMensualProjection;
import com.nethink.b2b.dto.response.ClienteSolicitudesMensualesProjection; 
import com.nethink.b2b.dto.response.ClienteSolicitudesIndicadorResponse; 
import java.time.LocalDateTime;
import java.math.BigDecimal;

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

@Query("""
SELECT h.solicitud
FROM SolicitudHistorial h
WHERE h.estado = 'ENTREGADA'
AND h.solicitud.estado = 'ENTREGADA'
GROUP BY h.solicitud
HAVING MAX(h.fecha) <= :fechaLimite
""")
List<Solicitud> listarSolicitudesEntregadasParaAutocompletar(
        @Param("fechaLimite") LocalDateTime fechaLimite
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
List<Object[]> obtenerSolicitudesAprobadasDashboard(
        @Param("idProveedor") Integer idProveedor,       
        @Param("inicioMesActual") LocalDateTime inicioMesActual,
        @Param("finMesActual") LocalDateTime finMesActual,
        @Param("inicioMesAnterior") LocalDateTime inicioMesAnterior,
        @Param("finMesAnterior") LocalDateTime finMesAnterior
);    
    
    

// dashboard de cliente

// cantidad de solicitudes actual

//@Query("""
//SELECT COUNT(sh)
//FROM SolicitudHistorial sh
//WHERE sh.solicitud.usuario.idUsuario = :idUsuario
//AND sh.estado = 'CREADA'
//AND sh.fecha >= :inicio
//AND sh.fecha < :fin
//""")
//Long clienteContarSolicitudesMesActual(
//        Integer idUsuario,
//        LocalDateTime inicio,
//        LocalDateTime fin
//);
//
//
//
//@Query("""
//SELECT COUNT(sh)
//FROM SolicitudHistorial sh
//WHERE sh.solicitud.usuario.idUsuario = :idUsuario
//AND sh.estado = 'CREADA'
//AND sh.fecha >= :inicio
//AND sh.fecha < :fin
//""")
//Long clienteContarSolicitudesMesAnterior(
//        Integer idUsuario,
//        LocalDateTime inicio,
//        LocalDateTime fin
//);
//
//
//
//
//
//@Query("""
//SELECT COUNT(sh)
//FROM SolicitudHistorial sh
//WHERE sh.solicitud.usuario.idUsuario = :idUsuario
//AND sh.estado = 'PEDIDO_APROBADO'
//AND sh.fecha >= :inicio
//AND sh.fecha < :fin
//""")
//Long clienteContarSolicitudesAprobadasMesActual(
//        Integer idUsuario,
//        LocalDateTime inicio,
//        LocalDateTime fin
//);
//
//
//
//
//@Query("""
//SELECT COUNT(sh)
//FROM SolicitudHistorial sh
//WHERE sh.solicitud.usuario.idUsuario = :idUsuario
//AND sh.estado = 'PEDIDO_APROBADO'
//AND sh.fecha >= :inicio
//AND sh.fecha < :fin
//""")
//Long clienteContarSolicitudesAprobadasMesAnterior(
//        Integer idUsuario,
//        LocalDateTime inicio,
//        LocalDateTime fin
//);
//
//
//@Query("""
//SELECT COALESCE(SUM(sh.solicitud.total),0)
//FROM SolicitudHistorial sh
//WHERE sh.solicitud.usuario.idUsuario = :idUsuario
//AND sh.estado = 'PEDIDO_APROBADO'
//AND sh.fecha >= :inicio
//AND sh.fecha < :fin
//""")
//BigDecimal clienteObtenerMontoAprobadoMesActual(
//        Integer idUsuario,
//        LocalDateTime inicio,
//        LocalDateTime fin
//);
//
//
//@Query("""
//SELECT COALESCE(SUM(sh.solicitud.total),0)
//FROM SolicitudHistorial sh
//WHERE sh.solicitud.usuario.idUsuario = :idUsuario
//AND sh.estado = 'PEDIDO_APROBADO'
//AND sh.fecha >= :inicio
//AND sh.fecha < :fin
//""")
//BigDecimal clienteObtenerMontoAprobadoMesAnterior(
//        Integer idUsuario,
//        LocalDateTime inicio,
//        LocalDateTime fin
//);
//
//
//@Query("""
//SELECT new com.nethink.b2b.dto.response.ClienteSolicitudesMensualesResponse(
//    FUNCTION('DATE_FORMAT', h.fecha, '%Y-%m'),
//    COUNT(DISTINCT h.solicitud.idSolicitud)
//)
//FROM SolicitudHistorial h
//WHERE h.idUsuario = :idUsuario
//AND h.estado = 'CREADA'
//AND h.fecha >= :inicio
//AND NOT EXISTS (
//    SELECT 1
//    FROM SolicitudHistorial h2
//    WHERE h2.solicitud.idSolicitud = h.solicitud.idSolicitud
//    AND h2.estado = 'CANCELADA'
//)
//GROUP BY FUNCTION('DATE_FORMAT', h.fecha, '%Y-%m')
//ORDER BY FUNCTION('DATE_FORMAT', h.fecha, '%Y-%m')
//""")
//List<ClienteSolicitudesMensualesResponse> clienteObtenerEvolucionSolicitudes(
//        Integer idUsuario,
//        LocalDateTime inicio)  ;




// Indicadores de cliente dashboard 


// indicador solicitudes cantidad mes actual y anterior

@Query("""
SELECT new com.nethink.b2b.dto.response.ClienteSolicitudesIndicadorResponse(

COUNT(DISTINCT CASE
    WHEN h.estado='CREADA'
    AND h.fecha>=:inicioMesActual
    AND h.fecha<:finMesActual
    THEN h.solicitud.idSolicitud
END),

COUNT(DISTINCT CASE
    WHEN h.estado='CREADA'
    AND h.fecha>=:inicioMesAnterior
    AND h.fecha<:finMesAnterior
    THEN h.solicitud.idSolicitud
END)

)
FROM SolicitudHistorial h
WHERE h.idUsuario=:idUsuario
""")
ClienteSolicitudesIndicadorResponse obtenerIndicadorSolicitudes( 
        Integer idUsuario, 
        LocalDateTime inicioMesActual, 
        LocalDateTime finMesActual, 
        LocalDateTime inicioMesAnterior, 
        LocalDateTime finMesAnterior);




// monto aprobado del mes actual y anterior y cantidad de solicitudes aprobadas mes actual y anterior


@Query("""
SELECT new com.nethink.b2b.dto.response.ClienteAprobadasIndicadorResponse(

COUNT(DISTINCT CASE
    WHEN h.estado = 'PEDIDO_APROBADO'
    AND h.fecha >= :inicioMesActual
    AND h.fecha < :finMesActual

    AND NOT EXISTS (
        SELECT 1
        FROM SolicitudHistorial hCancel
        WHERE hCancel.solicitud.idSolicitud = h.solicitud.idSolicitud
        AND hCancel.estado = 'CANCELADA'
        AND hCancel.fecha > h.fecha
    )

    THEN h.solicitud.idSolicitud
END),


COUNT(DISTINCT CASE
    WHEN h.estado = 'PEDIDO_APROBADO'
    AND h.fecha >= :inicioMesAnterior
    AND h.fecha < :finMesAnterior

    AND NOT EXISTS (
        SELECT 1
        FROM SolicitudHistorial hCancel2
        WHERE hCancel2.solicitud.idSolicitud = h.solicitud.idSolicitud
        AND hCancel2.estado = 'CANCELADA'
        AND hCancel2.fecha > h.fecha
    )

    THEN h.solicitud.idSolicitud
END),


COALESCE(
SUM(DISTINCT CASE
    WHEN h.estado = 'PEDIDO_APROBADO'
    AND h.fecha >= :inicioMesActual
    AND h.fecha < :finMesActual

    AND NOT EXISTS (
        SELECT 1
        FROM SolicitudHistorial hCancel3
        WHERE hCancel3.solicitud.idSolicitud = h.solicitud.idSolicitud
        AND hCancel3.estado = 'CANCELADA'
        AND hCancel3.fecha > h.fecha
    )

    THEN h.solicitud.total
END),0),


COALESCE(
SUM(DISTINCT CASE
    WHEN h.estado = 'PEDIDO_APROBADO'
    AND h.fecha >= :inicioMesAnterior
    AND h.fecha < :finMesAnterior

    AND NOT EXISTS (
        SELECT 1
        FROM SolicitudHistorial hCancel4
        WHERE hCancel4.solicitud.idSolicitud = h.solicitud.idSolicitud
        AND hCancel4.estado = 'CANCELADA'
        AND hCancel4.fecha > h.fecha
    )

    THEN h.solicitud.total
END),0)

)

FROM SolicitudHistorial h

WHERE h.idUsuario = :idUsuario

""")
ClienteAprobadasIndicadorResponse obtenerIndicadorAprobadas(
        Integer idUsuario,
        LocalDateTime inicioMesActual,
        LocalDateTime finMesActual,
        LocalDateTime inicioMesAnterior,
        LocalDateTime finMesAnterior
);




















//@Query("""
//SELECT new com.nethink.b2b.dto.response.ClienteAprobadasIndicadorResponse(
//
//COUNT(DISTINCT CASE
//    WHEN h.estado = 'PEDIDO_APROBADO'
//    AND h.fecha >= :inicioMesActual
//    AND h.fecha < :finMesActual
//    THEN h.solicitud.idSolicitud
//END),
//
//COUNT(DISTINCT CASE
//    WHEN h.estado = 'PEDIDO_APROBADO'
//    AND h.fecha >= :inicioMesAnterior
//    AND h.fecha < :finMesAnterior
//    THEN h.solicitud.idSolicitud
//END),
//
//(
//SELECT COALESCE(SUM(s.total),0)
//FROM Solicitud s
//WHERE s.idSolicitud IN (
//    SELECT DISTINCT h1.solicitud.idSolicitud
//    FROM SolicitudHistorial h1
//    WHERE h1.idUsuario = :idUsuario
//    AND h1.estado='PEDIDO_APROBADO'
//    AND h1.fecha >= :inicioMesActual
//    AND h1.fecha < :finMesActual
//)
//),
//
//(
//SELECT COALESCE(SUM(s.total),0)
//FROM Solicitud s
//WHERE s.idSolicitud IN (
//    SELECT DISTINCT h2.solicitud.idSolicitud
//    FROM SolicitudHistorial h2
//    WHERE h2.idUsuario = :idUsuario
//    AND h2.estado='PEDIDO_APROBADO'
//    AND h2.fecha >= :inicioMesAnterior
//    AND h2.fecha < :finMesAnterior
//)
//)
//
//)
//FROM SolicitudHistorial h
//WHERE h.idUsuario = :idUsuario
//""")
//ClienteAprobadasIndicadorResponse obtenerIndicadorAprobadas(
//        Integer idUsuario,
//        LocalDateTime inicioMesActual,
//        LocalDateTime finMesActual,
//        LocalDateTime inicioMesAnterior,
//        LocalDateTime finMesAnterior
//);




// datos de grafico de solicitudes evolucion

@Query(value = """
SELECT

DATE_FORMAT(h.fecha,'%Y-%m') AS mes,

COUNT(DISTINCT h.id_solicitud) AS cantidadSolicitudes

FROM solicitud_historial h

WHERE h.id_usuario=:idUsuario

AND h.estado='CREADA'

AND h.fecha>=:inicio

AND NOT EXISTS(

SELECT 1

FROM solicitud_historial h2

WHERE h2.id_solicitud=h.id_solicitud

AND h2.estado='CANCELADA'

)

GROUP BY DATE_FORMAT(h.fecha,'%Y-%m')

ORDER BY mes

""", nativeQuery = true)
List<ClienteSolicitudesMensualesProjection> obtenerEvolucionSolicitudes(
        Integer idUsuario,
        LocalDateTime inicio
);









//@Query("""
//SELECT new com.nethink.b2b.dto.response.ClienteSolicitudesMensualesResponse(
//
//    FUNCTION('DATE_FORMAT', h.fecha, '%Y-%m'),
//
//    COUNT(DISTINCT h.solicitud.idSolicitud)
//
//)
//
//FROM SolicitudHistorial h
//
//WHERE h.idUsuario = :idUsuario
//
//AND h.estado = 'CREADA'
//
//AND h.fecha >= :inicio
//
//AND NOT EXISTS (
//
//    SELECT 1
//    FROM SolicitudHistorial h2
//
//    WHERE h2.solicitud.idSolicitud = h.solicitud.idSolicitud
//
//    AND h2.estado = 'CANCELADA'
//
//)
//
//GROUP BY FUNCTION('DATE_FORMAT', h.fecha, '%Y-%m')
//
//ORDER BY FUNCTION('DATE_FORMAT', h.fecha, '%Y-%m')
//
//""")
//List<ClienteSolicitudesMensualesResponse> obtenerEvolucionSolicitudes(
//        Integer idUsuario,
//        LocalDateTime inicio
//);


// datos grafico de productos solicitados

@Query("""
SELECT new com.nethink.b2b.dto.response.ClienteProductoSolicitadoResponse(

    pp.producto.nombre,

    SUM(d.cantidad)

)

FROM SolicitudHistorial h

JOIN h.solicitud s

JOIN s.detalles d

JOIN d.proveedorProducto pp


WHERE h.idUsuario = :idUsuario

AND h.estado = 'CREADA'


AND NOT EXISTS (

    SELECT 1

    FROM SolicitudHistorial h2

    WHERE h2.solicitud.idSolicitud = s.idSolicitud

    AND h2.estado = 'CANCELADA'
    AND h.fecha >= :inicio   

)


GROUP BY pp.producto.nombre

ORDER BY SUM(d.cantidad) DESC

""")
List<ClienteProductoSolicitadoResponse> obtenerProductosMasSolicitados(
        Integer idUsuario, LocalDateTime inicio
);


// datos grafico monto mensual ultimos seis meses

@Query(value = """
SELECT

    DATE_FORMAT(hAprobada.fecha, '%Y-%m') AS mes,

    SUM(s.total) AS montoAprobado

FROM solicitudes s

INNER JOIN solicitud_historial hCliente

    ON hCliente.id_solicitud = s.id_solicitud

    AND hCliente.id_usuario = :idUsuario

    AND hCliente.estado = 'CREADA'

INNER JOIN solicitud_historial hAprobada

    ON hAprobada.id_solicitud = s.id_solicitud

    AND hAprobada.estado = 'PEDIDO_APROBADO'

WHERE hAprobada.fecha >= :inicio

AND NOT EXISTS (

    SELECT 1

    FROM solicitud_historial hCancelada

    WHERE hCancelada.id_solicitud = s.id_solicitud

    AND hCancelada.estado = 'CANCELADA'

)

GROUP BY DATE_FORMAT(hAprobada.fecha, '%Y-%m')

ORDER BY mes

""", nativeQuery = true)
List<ClienteMontoAprobadoMensualProjection> obtenerMontoAprobadoPorMes(
        @Param("idUsuario") Integer idUsuario,
        @Param("inicio") LocalDateTime inicio
);





//@Query(value = """
//SELECT 
//    DATE_FORMAT(t.fecha_aprobacion, '%Y-%m') AS mes,
//    SUM(t.total) AS montoAprobado
//
//FROM (
//
//    SELECT DISTINCT
//        h.id_solicitud,
//        h.fecha AS fecha_aprobacion,
//        s.total
//
//    FROM solicitud_historial h
//
//    INNER JOIN solicitudes s
//        ON s.id_solicitud = h.id_solicitud
//
//
//    WHERE h.id_usuario = :idUsuario
//
//    AND h.estado = 'PEDIDO_APROBADO'
//
//    AND h.fecha >= :inicio
//
//
//    AND NOT EXISTS (
//
//        SELECT 1
//
//        FROM solicitud_historial h2
//
//        WHERE h2.id_solicitud = h.id_solicitud
//
//        AND h2.estado = 'CANCELADA'
//
//    )
//
//) t
//
//GROUP BY DATE_FORMAT(t.fecha_aprobacion, '%Y-%m')
//
//ORDER BY mes
//
//""", nativeQuery = true)
//List<ClienteMontoAprobadoMensualProjection> obtenerMontoAprobadoPorMes(
//        @Param("idUsuario") Integer idUsuario,
//        @Param("inicio") LocalDateTime inicio
//);





    
}
