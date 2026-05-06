package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.*;
import com.nethink.b2b.entity.*;
import com.nethink.b2b.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SyncCatalogoService {

    private final ProductoRepository productoRepo;
    private final MarcaRepository marcaRepo;
    private final CategoriaRepository categoriaRepo;
    private final ProductoEspecificacionRepository specRepo;
    private final ProductoImagenRepository imagenRepo;

    public SyncCatalogoService(
            ProductoRepository productoRepo,
            MarcaRepository marcaRepo,
            CategoriaRepository categoriaRepo,
            ProductoEspecificacionRepository specRepo,
            ProductoImagenRepository imagenRepo) {

        this.productoRepo = productoRepo;
        this.marcaRepo = marcaRepo;
        this.categoriaRepo = categoriaRepo;
        this.specRepo = specRepo;
        this.imagenRepo = imagenRepo;
    }

    public void sync(CatalogoResponse dto) {

        Marca marca = marcaRepo.findByNombre(dto.getMarca())
                .orElseGet(() -> {
                    Marca m = new Marca();
                    m.setNombre(dto.getMarca());
                    return marcaRepo.save(m);
                });

        Categoria categoria = categoriaRepo.findByNombre(dto.getCategoria())
                .orElseGet(() -> {
                    Categoria c = new Categoria();
                    c.setNombre(dto.getCategoria());
                    return categoriaRepo.save(c);
                });

        Producto producto = productoRepo
                .findByNombreAndMarca_IdMarca(dto.getProducto(), marca.getIdMarca())
                .orElseGet(() -> {
                    Producto p = new Producto();
                    p.setNombre(dto.getProducto());
                    p.setMarca(marca);
                    p.setCategoria(categoria);
                    return productoRepo.save(p);
                });

        producto.setCategoria(categoria);
        productoRepo.save(producto);

        if (dto.getEspecificaciones() != null) {
            specRepo.deleteByProducto_IdProducto(producto.getIdProducto());

            dto.getEspecificaciones().forEach(e -> {
                ProductoEspecificacion spec = new ProductoEspecificacion();
                spec.setProducto(producto);
                spec.setNombre(e.getNombre());
                spec.setValor(e.getValor());
                specRepo.save(spec);
            });
        }

        if (dto.getImagenes() != null) {
            imagenRepo.deleteByProducto_IdProducto(producto.getIdProducto());

            int orden = 1;
            for (ImagenResponse img : dto.getImagenes()) {
                ProductoImagen pi = new ProductoImagen();
                pi.setProducto(producto);
                pi.setUrl(img.getUrl());
                pi.setPrincipal(Boolean.TRUE.equals(img.getPrincipal()));
                pi.setOrden(orden++);
                imagenRepo.save(pi);
            }
        }
    }
}