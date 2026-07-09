package com.nethink.b2b.repository;

import com.nethink.b2b.entity.DetalleSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


import org.springframework.data.repository.query.Param;
import java.util.List;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.Query;
import com.nethink.b2b.dto.response.SolicitudDetalleEntregaResponse; 

@Repository
public interface DetalleSolicitudRepository extends JpaRepository<DetalleSolicitud, Integer> {
    
    
    /* se añadio query para buscar los detalles segun la id de solicitud
    
    @Query("""
    SELECT DISTINCT d
    FROM DetalleSolicitud d
    JOIN FETCH d.proveedorProducto pp
    JOIN FETCH pp.producto p
    LEFT JOIN FETCH p.especificaciones pe
    WHERE d.solicitud.idSolicitud = :idSolicitud
""")
 List<DetalleSolicitud> listarDetalles(@Param("idSolicitud") Integer idSolicitud); */  
    
   
@Query("""
    SELECT d
    FROM DetalleSolicitud d
    JOIN FETCH d.proveedorProducto pp
    JOIN FETCH pp.producto p
    LEFT JOIN FETCH p.marca m
    LEFT JOIN FETCH p.categoria c
    WHERE d.solicitud.idSolicitud = :idSolicitud
""")
List<DetalleSolicitud> listarDetalles(@Param("idSolicitud") Integer idSolicitud);


// listar detalles de solicitudes en fase entregas




@Query("""
SELECT new com.nethink.b2b.dto.response.SolicitudDetalleEntregaResponse(

    s.idSolicitud,

    p.nombre,

    ds.cantidad,
       
    p.skuGlobal,

    CAST(s.estado AS string),

    s.fechaCreacion

)

FROM DetalleSolicitud ds

JOIN ds.proveedorProducto pp

JOIN pp.producto p

JOIN ds.solicitud s

WHERE s.proveedor.idProveedor = :idProveedor

AND s.estado IN (
    'PAGADA',
    'EN_PREPARACION',
    'EN_CAMINO',
    'ENTREGADA'
)
       
AND  s.idSolicitud = :idSolicitud

ORDER BY s.fechaCreacion DESC
""")
List<SolicitudDetalleEntregaResponse>
listarDetallesEntregaProveedor(
    @Param("idProveedor") Integer idProveedor,
    @Param("idSolicitud") Integer idSolicitud
);


// cinco productos más vendidos en el mes actual 


@Query("""
SELECT
    d.proveedorProducto.producto.nombre,
    SUM(d.cantidad)

FROM DetalleSolicitud d

WHERE d.solicitud.proveedor.idProveedor = :idProveedor

AND EXISTS (

    SELECT 1
    FROM Pago p
    WHERE p.solicitud.idSolicitud = d.solicitud.idSolicitud
    AND p.estado = 'APROBADO'
    AND p.fechaPago >= :inicioMesActual
    AND p.fechaPago < :finMesActual

)

GROUP BY
    d.proveedorProducto.producto.idProducto,
    d.proveedorProducto.producto.nombre

ORDER BY
    SUM(d.cantidad) DESC
""")
List<Object[]> obtenerProductosMasVendidosMesActual(
        @Param("idProveedor") Integer idProveedor,
        @Param("inicioMesActual") LocalDateTime inicioMesActual,
        @Param("finMesActual") LocalDateTime finMesActual,
        Pageable pageable
);





//version dos

/*   @Query("""
SELECT new com.nethink.b2b.dto.response.SolicitudDetalleEntregaResponse(

    ds.solicitud.idSolicitud,

    p.nombre,

    ds.cantidad,

    ds.solicitud.estado.name(),

    ds.solicitud.fechaCreacion

)

FROM DetalleSolicitud ds

JOIN ds.proveedorProducto pp

JOIN pp.producto p

JOIN ds.solicitud s

WHERE s.proveedor.idProveedor = :idProveedor

AND s.estado IN (

    'PAGADA',

    'EN_PREPARACION',

    'EN_CAMINO',

    'ENTREGADA'

)

ORDER BY s.fechaCreacion DESC
""")
List<SolicitudDetalleEntregaResponse>
listarDetallesEntregaProveedordos(

        @Param("idProveedor")
        Integer idProveedor
); */







 
    
    
//}
    
    
    
    
    
    
    
  /*  
    @Query("""
    SELECT d
    FROM DetalleSolicitud d
    JOIN FETCH d.proveedorProducto pp
    JOIN FETCH pp.producto p
    JOIN FETCH p.categoria
    WHERE d.solicitud.idSolicitud = :idSolicitud
""")
List<DetalleSolicitud> listarDetalles(@Param("idSolicitud") Integer idSolicitud);
*/
    
    
    
}
