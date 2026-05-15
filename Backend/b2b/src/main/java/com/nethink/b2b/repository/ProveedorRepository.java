package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProveedorRepository
        extends JpaRepository<Proveedor, Integer> {

    Optional<Proveedor> findByRazonSocial(String razonSocial);

    Optional<Proveedor> findByRuc(String ruc);

    List<Proveedor> findByEstado(String estado);

    List<Proveedor> findByApiTipoAndEstado(
            String apiTipo,
            String estado
    );

    List<Proveedor> findByApiUrlIsNotNullAndEstado(
            String estado
    );
    Optional<Proveedor> findByUsuario_Correo(String correo);
}