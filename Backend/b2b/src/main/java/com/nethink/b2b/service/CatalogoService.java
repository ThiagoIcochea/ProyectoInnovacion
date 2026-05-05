package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.*;
import com.nethink.b2b.entity.*;
import com.nethink.b2b.repository.*;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CatalogoService {

    private final ProveedorProductoRepository repo;
    private final ProductoEspecificacionRepository specRepo;
    private final DescuentoVolumenRepository descRepo;
    private final ProductoImagenRepository imagenRepo;
    public CatalogoService(ProveedorProductoRepository repo, ProductoEspecificacionRepository specRepo, DescuentoVolumenRepository descRepo, ProductoImagenRepository imagenRepo) {
        this.repo = repo;
        this.specRepo = specRepo;
        this.descRepo = descRepo;
        this.imagenRepo = imagenRepo;
    }

  public List<CatalogoResponse> listarCatalogo() {

    return repo.findAll().stream().map(p -> {

        CatalogoResponse r = new CatalogoResponse();

        r.setProducto(p.getProducto().getNombre());
        r.setMarca(p.getProducto().getMarca().getNombre());
        r.setCategoria(p.getProducto().getCategoria().getNombre());

        r.setProveedor(p.getProveedor().getRazonSocial());
        r.setPrecio(p.getPrecio());
        r.setStock(p.getStock());
        r.setTiempoEntrega(p.getTiempoEntregaDias());
        r.setPorcentajeDescuento(p.getPorcentajeDescuento());

        
        List<EspecificacionResponse> specs =
                specRepo.findByProducto_IdProducto(p.getProducto().getIdProducto())
                        .stream()
                        .map(e -> {
                            EspecificacionResponse er = new EspecificacionResponse();
                            er.setNombre(e.getNombre());
                            er.setValor(e.getValor());
                            return er;
                        }).collect(Collectors.toList());

        r.setEspecificaciones(specs);

       
        List<DescuentoVolumenResponse> descs =
                descRepo.findByProveedorProducto_IdProvProd(p.getIdProvProd())
                        .stream()
                        .map(d -> {
                            DescuentoVolumenResponse dr = new DescuentoVolumenResponse();
                            dr.setCantidadMin(d.getCantidadMin());
                            dr.setPrecioUnitario(d.getPrecioUnitario());
                            return dr;
                        }).collect(Collectors.toList());

        r.setDescuentosVolumen(descs);

        
        List<ImagenResponse> imagenes =
                imagenRepo.findByProducto_IdProducto(p.getProducto().getIdProducto())
                        .stream()
                        .map(img -> {
                            ImagenResponse i = new ImagenResponse();
                            i.setUrl(img.getUrl());
                            i.setPrincipal(img.getPrincipal());
                            return i;
                        })
                        .collect(Collectors.toList());

        r.setImagenes(imagenes);

        return r;

    }).collect(Collectors.toList());
}
    
}