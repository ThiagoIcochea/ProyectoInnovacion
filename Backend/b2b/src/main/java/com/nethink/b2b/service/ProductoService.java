package com.nethink.b2b.service;

import com.nethink.b2b.entity.Producto;
import com.nethink.b2b.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public List<Producto> listarProductos(String filtro) {

        if (filtro != null && !filtro.isEmpty()) {
            return productoRepository.findByNombreContainingIgnoreCase(filtro);
        }

        return productoRepository.findAll();
    }
}