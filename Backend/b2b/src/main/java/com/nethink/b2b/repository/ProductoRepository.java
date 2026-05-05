package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    List<Producto> findByNombreContainingIgnoreCase(String nombre);
   Optional<Producto> findByNombreAndMarca_IdMarca(String nombre, Integer idMarca);
}