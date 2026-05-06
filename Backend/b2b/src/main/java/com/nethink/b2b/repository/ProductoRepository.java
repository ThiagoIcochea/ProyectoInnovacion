package com.nethink.b2b.repository;

import com.nethink.b2b.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    List<Producto> findByNombreContainingIgnoreCase(String nombre);
   Optional<Producto> findByNombreAndMarca_IdMarca(String nombre, Integer idMarca);
   @Query("""
SELECT p FROM Producto p
JOIN FETCH p.marca
JOIN FETCH p.categoria
""")
List<Producto> findCatalogoBase();
@Query("SELECT DISTINCT p FROM Producto p " +
       "WHERE (:categorias IS NULL OR p.categoria.idCategoria IN :categorias) " +
       "AND (:marcas IS NULL OR p.marca.idMarca IN :marcas) " +
       "AND p.estado = 'ACTIVO'")
List<Producto> buscarConFiltros(
    @Param("categorias") List<Integer> categorias, 
    @Param("marcas") List<Integer> marcas
);

}