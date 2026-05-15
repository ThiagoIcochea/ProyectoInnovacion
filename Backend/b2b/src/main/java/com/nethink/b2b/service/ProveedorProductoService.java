package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.DescuentoVolumenResponse;
import com.nethink.b2b.dto.response.EspecificacionResponse;
import com.nethink.b2b.dto.response.ImagenResponse;
import com.nethink.b2b.dto.response.ProveedorProductoResponse;
import com.nethink.b2b.entity.Producto;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.repository.DescuentoVolumenRepository;
import com.nethink.b2b.repository.ProductoEspecificacionRepository;
import com.nethink.b2b.repository.ProductoImagenRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProveedorProductoService {

    private final ProveedorProductoRepository proveedorProductoRepo;
    private final InventarioReservaService reservaService;
    private final ProductoEspecificacionRepository specRepo;
    private final ProductoImagenRepository imagenRepo;
    private final DescuentoVolumenRepository descuentoRepo;

    public ProveedorProductoService(
            ProveedorProductoRepository proveedorProductoRepo,
            InventarioReservaService reservaService,
            ProductoEspecificacionRepository specRepo,
            ProductoImagenRepository imagenRepo,
            DescuentoVolumenRepository descuentoRepo
    ) {
        this.proveedorProductoRepo = proveedorProductoRepo;
        this.reservaService = reservaService;
        this.specRepo = specRepo;
        this.imagenRepo = imagenRepo;
        this.descuentoRepo = descuentoRepo;
    }

    public List<ProveedorProductoResponse> listarProductosPorProveedor(Integer idProveedor) {

        List<ProveedorProducto> lista =
                proveedorProductoRepo.findByProveedor_IdProveedor(idProveedor);

        List<ProveedorProductoResponse> response = new ArrayList<>();

        for (ProveedorProducto pp : lista) {

            Producto p = pp.getProducto();

            ProveedorProductoResponse dto = new ProveedorProductoResponse();

            dto.setIdProvProd(pp.getIdProvProd());
            dto.setPrecio(pp.getPrecio().doubleValue());
            dto.setStock(pp.getStock());
            dto.setGarantiaMeses(pp.getGarantiaMeses());
            dto.setTiempoEntregaDias(pp.getTiempoEntregaDias());
            dto.setEnOferta(pp.getEnOferta());
            dto.setPorcentajeDescuento(pp.getPorcentajeDescuento());
            dto.setEstado(pp.getEstado());

            dto.setIdProducto(p.getIdProducto());
            dto.setNombre(p.getNombre());
            dto.setDescripcion(p.getDescripcion());
            dto.setSkuGlobal(p.getSkuGlobal());
            dto.setFuente(p.getFuente());
            dto.setApiOrigen(p.getApiOrigen());
            dto.setEstadoProducto(p.getEstado());

            dto.setIdMarca(p.getMarca().getIdMarca());
            dto.setMarca(p.getMarca().getNombre());

            dto.setIdCategoria(p.getCategoria().getIdCategoria());
            dto.setCategoria(p.getCategoria().getNombre());

            dto.setStockDisponible(
                    reservaService.calcularStockDisponible(pp)
            );

            dto.setEspecificaciones(
                    specRepo.findByProducto_IdProducto(p.getIdProducto())
                            .stream()
                            .map(e -> {
                                EspecificacionResponse r = new EspecificacionResponse();
                                r.setNombre(e.getNombre());
                                r.setValor(e.getValor());
                                return r;
                            }).toList()
            );

            dto.setImagenes(
                    imagenRepo.findByProducto_IdProducto(p.getIdProducto())
                            .stream()
                            .map(i -> {
                                ImagenResponse r = new ImagenResponse();
                                r.setUrl(i.getUrl());
                                r.setPrincipal(i.getPrincipal());
                                r.setOrden(i.getOrden());
                                return r;
                            }).toList()
            );

            dto.setDescuentosVolumen(
                    descuentoRepo.findByProveedorProducto_IdProvProd(pp.getIdProvProd())
                            .stream()
                            .map(d -> {
                                DescuentoVolumenResponse r = new DescuentoVolumenResponse();
                                r.setCantidadMin(d.getCantidadMin());
                                r.setPrecioUnitario(d.getPrecioUnitario());
                                return r;
                            }).toList()
            );

            response.add(dto);
        }

        return response;
    }
}