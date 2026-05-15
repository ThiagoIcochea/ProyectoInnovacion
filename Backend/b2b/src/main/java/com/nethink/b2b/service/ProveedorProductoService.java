package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.DescuentoVolumenResponse;
import com.nethink.b2b.dto.response.EspecificacionResponse;
import com.nethink.b2b.dto.response.ImagenResponse;
import com.nethink.b2b.dto.response.ProveedorProductoResponse;
import com.nethink.b2b.entity.Producto;
import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.repository.DescuentoVolumenRepository;
import com.nethink.b2b.repository.ProductoEspecificacionRepository;
import com.nethink.b2b.repository.ProductoImagenRepository;

import com.nethink.b2b.repository.ProveedorProductoRepository;
import com.nethink.b2b.repository.ProveedorRepository;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.stream.Collectors;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProveedorProductoService {

    private final ProveedorProductoRepository proveedorProductoRepo;
    private final InventarioReservaService reservaService;
    private final ProductoEspecificacionRepository specRepo;
    private final ProductoImagenRepository imagenRepo;
    private final DescuentoVolumenRepository descuentoRepo;
    private final ProveedorRepository  proveedorRepo;

    public ProveedorProductoService(
            ProveedorProductoRepository proveedorProductoRepo,
            InventarioReservaService reservaService,
            ProductoEspecificacionRepository specRepo,
            ProductoImagenRepository imagenRepo,
            DescuentoVolumenRepository descuentoRepo,
            ProveedorRepository proveedorRepo
    ) {
        this.proveedorProductoRepo = proveedorProductoRepo;
        this.reservaService = reservaService;
        this.specRepo = specRepo;
        this.imagenRepo = imagenRepo;
        this.descuentoRepo = descuentoRepo;
        this.proveedorRepo = proveedorRepo;
    }

  public List<ProveedorProductoResponse> listarProductosPorProveedor(String correo) {

    Proveedor proveedor =
            proveedorRepo.findByUsuario_Correo(correo)
                    .orElseThrow();

    List<ProveedorProducto> lista =
            proveedorProductoRepo.findProductosCompletosPorProveedor(
                    proveedor.getIdProveedor()
            );

    List<Integer> productosIds = lista.stream()
            .map(pp -> pp.getProducto().getIdProducto())
            .distinct()
            .toList();

    List<Integer> provProdIds = lista.stream()
            .map(ProveedorProducto::getIdProvProd)
            .distinct()
            .toList();

    Map<Integer, List<EspecificacionResponse>> specsMap =
            specRepo.findByProducto_IdProductoIn(productosIds)
                    .stream()
                    .collect(Collectors.groupingBy(
                            e -> e.getProducto().getIdProducto(),
                            Collectors.mapping(e -> {

                                EspecificacionResponse r =
                                        new EspecificacionResponse();

                                r.setNombre(e.getNombre());
                                r.setValor(e.getValor());

                                return r;

                            }, Collectors.toList())
                    ));

    Map<Integer, List<ImagenResponse>> imagenesMap =
            imagenRepo.findByProducto_IdProductoIn(productosIds)
                    .stream()
                    .collect(Collectors.groupingBy(
                            i -> i.getProducto().getIdProducto(),
                            Collectors.mapping(i -> {

                                ImagenResponse r =
                                        new ImagenResponse();

                                r.setUrl(i.getUrl());
                                r.setPrincipal(i.getPrincipal());
                                r.setOrden(i.getOrden());

                                return r;

                            }, Collectors.toList())
                    ));

    Map<Integer, List<DescuentoVolumenResponse>> descuentosMap =
            descuentoRepo.findByProveedorProducto_IdProvProdIn(provProdIds)
                    .stream()
                    .collect(Collectors.groupingBy(
                            d -> d.getProveedorProducto().getIdProvProd(),
                            Collectors.mapping(d -> {

                                DescuentoVolumenResponse r =
                                        new DescuentoVolumenResponse();

                                r.setCantidadMin(d.getCantidadMin());
                                r.setPrecioUnitario(d.getPrecioUnitario());

                                return r;

                            }, Collectors.toList())
                    ));

    List<ProveedorProductoResponse> response = new ArrayList<>();

    for (ProveedorProducto pp : lista) {

        Producto p = pp.getProducto();

        ProveedorProductoResponse dto =
                new ProveedorProductoResponse();

        dto.setIdProvProd(pp.getIdProvProd());

        dto.setPrecio(
                pp.getPrecio() != null
                        ? pp.getPrecio().doubleValue()
                        : 0.0
        );

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
                specsMap.getOrDefault(
                        p.getIdProducto(),
                        new ArrayList<>()
                )
        );

        dto.setImagenes(
                imagenesMap.getOrDefault(
                        p.getIdProducto(),
                        new ArrayList<>()
                )
        );

        dto.setDescuentosVolumen(
                descuentosMap.getOrDefault(
                        pp.getIdProvProd(),
                        new ArrayList<>()
                )
        );

        response.add(dto);
    }

    return response;
}
}