package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Reclamo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReclamoRepository extends JpaRepository<Reclamo, Integer> {

    @Query("""
        SELECT COUNT(r)
        FROM Reclamo r
        WHERE r.idProveedor = :idProveedor
    """)
    Integer contarReclamos(Integer idProveedor);
}