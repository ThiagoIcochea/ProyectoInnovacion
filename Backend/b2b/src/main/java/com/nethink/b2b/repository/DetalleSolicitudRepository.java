package com.nethink.b2b.repository;

import com.nethink.b2b.entity.DetalleSolicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import org.springframework.data.repository.query.Param;
import java.util.List;
import org.springframework.data.jpa.repository.Query;

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
