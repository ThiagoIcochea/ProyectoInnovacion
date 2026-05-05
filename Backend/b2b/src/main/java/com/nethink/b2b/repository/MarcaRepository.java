package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Marca;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MarcaRepository extends JpaRepository<Marca, Integer> {

    Optional<Marca> findByNombre(String nombre);
}