package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.*;
import com.nethink.b2b.entity.Producto;
import com.nethink.b2b.entity.ProductoEspecificacion;
import com.nethink.b2b.entity.ProductoImagen;
import com.nethink.b2b.repository.*;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CatalogoService {

    private final ProductoRepository productoRepo;
    private final ProductoEspecificacionRepository specRepo;
    private final ProductoImagenRepository imagenRepo;

    public CatalogoService(ProductoRepository productoRepo,
                           ProductoEspecificacionRepository specRepo,
                           ProductoImagenRepository imagenRepo) {
        this.productoRepo = productoRepo;
        this.specRepo = specRepo;
        this.imagenRepo = imagenRepo;
    }

   public List<CatalogoResponse> listarCatalogo() {

    List<Producto> productos = productoRepo.findCatalogoBase();

    List<Integer> ids = productos.stream()
            .map(Producto::getIdProducto)
            .toList();

    List<ProductoEspecificacion> specs = specRepo.findByProducto_IdProductoIn(ids);
    List<ProductoImagen> imagenes = imagenRepo.findByProducto_IdProductoIn(ids);

    return productos.stream().map(p -> {

        CatalogoResponse r = new CatalogoResponse();

        r.setIdProducto(p.getIdProducto());
        r.setProducto(p.getNombre());
        r.setMarca(p.getMarca().getNombre());
        r.setCategoria(p.getCategoria().getNombre());
        r.setDescripcion(p.getDescripcion());

        List<EspecificacionResponse> specDto = specs.stream()
                .filter(s -> s.getProducto().getIdProducto().equals(p.getIdProducto()))
                .map(e -> {
                    EspecificacionResponse er = new EspecificacionResponse();
                    er.setNombre(e.getNombre());
                    er.setValor(e.getValor());
                    return er;
                }).toList();

        List<ImagenResponse> imgDto = imagenes.stream()
                .filter(i -> i.getProducto().getIdProducto().equals(p.getIdProducto()))
                .map(img -> {
                    ImagenResponse ir = new ImagenResponse();
                    ir.setUrl(img.getUrl());
                    ir.setPrincipal(img.getPrincipal());
                    return ir;
                }).toList();

        r.setEspecificaciones(specDto);
        r.setImagenes(imgDto);

        return r;

    }).toList();
}
    
}