package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.DescuentoVolumenResponse;
import com.nethink.b2b.dto.response.EspecificacionResponse;
import com.nethink.b2b.dto.response.ImagenResponse;
import com.nethink.b2b.dto.response.ProveedorProductoResponse;
import com.nethink.b2b.entity.Producto;
import com.nethink.b2b.entity.Marca;
import com.nethink.b2b.entity.Categoria;
import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.repository.DescuentoVolumenRepository;
import com.nethink.b2b.repository.ProductoEspecificacionRepository;
import com.nethink.b2b.repository.ProductoImagenRepository;

import com.nethink.b2b.repository.ProveedorProductoRepository;
import com.nethink.b2b.repository.ProveedorRepository;
import com.nethink.b2b.repository.ProductoRepository;
import com.nethink.b2b.repository.MarcaRepository;
import com.nethink.b2b.repository.CategoriaRepository;
import com.nethink.b2b.dto.response.CatalogoResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
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
    private final ProductoRepository productoRepo;
    private final MarcaRepository marcaRepo;
    private final CategoriaRepository categoriaRepo;

    public ProveedorProductoService(
            ProveedorProductoRepository proveedorProductoRepo,
            InventarioReservaService reservaService,
            ProductoEspecificacionRepository specRepo,
            ProductoImagenRepository imagenRepo,
            DescuentoVolumenRepository descuentoRepo,
            ProveedorRepository proveedorRepo,
            ProductoRepository productoRepo,
            MarcaRepository marcaRepo,
            CategoriaRepository categoriaRepo
    ) {
        this.proveedorProductoRepo = proveedorProductoRepo;
        this.reservaService = reservaService;
        this.specRepo = specRepo;
        this.imagenRepo = imagenRepo;
        this.descuentoRepo = descuentoRepo;
        this.proveedorRepo = proveedorRepo;
        this.productoRepo = productoRepo;
        this.marcaRepo = marcaRepo;
        this.categoriaRepo = categoriaRepo;
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

    @Transactional
    public ProveedorProductoResponse crearProductoProveedor(String correo, CatalogoResponse entrada) {
        if (entrada == null || esVacio(entrada.getProducto()) || esVacio(entrada.getMarca())
                || esVacio(entrada.getCategoria()) || entrada.getPrecioUnitario() == null
                || entrada.getPrecioUnitario().signum() < 0 || entrada.getStock() == null || entrada.getStock() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Producto, marca, categoria, precio y stock son obligatorios.");
        }

        Proveedor proveedor = proveedorRepo.findByUsuario_Correo(correo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proveedor no encontrado."));
        Marca marca = buscarOCrearMarca(entrada.getMarca());
        Categoria categoria = buscarOCrearCategoria(entrada.getCategoria());
        Producto producto = resolverProducto(entrada, marca, categoria);

        ProveedorProducto proveedorProducto = proveedorProductoRepo
                .findByProveedor_IdProveedorAndProducto_IdProducto(proveedor.getIdProveedor(), producto.getIdProducto())
                .orElseGet(ProveedorProducto::new);
        proveedorProducto.setProveedor(proveedor);
        proveedorProducto.setProducto(producto);
        proveedorProducto.setPrecio(entrada.getPrecioUnitario());
        proveedorProducto.setStock(entrada.getStock());
        proveedorProducto.setGarantiaMeses(valorNoNegativo(entrada.getGarantiaMeses()));
        proveedorProducto.setTiempoEntregaDias(valorNoNegativo(entrada.getTiempoEntregaDias()));
        proveedorProducto.setEnOferta(Boolean.TRUE.equals(entrada.getEnOferta()));
        proveedorProducto.setPorcentajeDescuento(entrada.getPorcentajeDescuento() == null ? 0d : Math.max(0d, entrada.getPorcentajeDescuento()));
        proveedorProducto.setEstado(esVacio(entrada.getEstado()) ? "ACTIVO" : entrada.getEstado().trim().toUpperCase());
        proveedorProducto.setUltimaActualizacionStock(LocalDateTime.now());
        proveedorProducto = proveedorProductoRepo.save(proveedorProducto);

        reservaService.publicarNuevoProducto(proveedorProducto);
        final Integer idProvProd = proveedorProducto.getIdProvProd();
        return listarProductosPorProveedor(correo).stream()
                .filter(item -> idProvProd.equals(item.getIdProvProd()))
                .findFirst()
                .orElseThrow();
    }

    private Producto resolverProducto(CatalogoResponse entrada, Marca marca, Categoria categoria) {
        Producto producto = !esVacio(entrada.getSku())
                ? productoRepo.findBySkuGlobal(entrada.getSku().trim()).orElse(null)
                : null;
        if (producto == null) {
            producto = productoRepo.buscarProductoSimilar(entrada.getProducto().trim(), marca.getIdMarca(), categoria.getIdCategoria())
                    .orElseGet(Producto::new);
        }
        producto.setNombre(entrada.getProducto().trim());
        producto.setMarca(marca);
        producto.setCategoria(categoria);
        producto.setSkuGlobal(esVacio(entrada.getSku()) ? generarSku() : entrada.getSku().trim());
        producto.setDescripcion(esVacio(entrada.getDescripcion()) ? null : entrada.getDescripcion().trim());
        producto.setEstado(esVacio(entrada.getEstado()) ? "ACTIVO" : entrada.getEstado().trim().toUpperCase());
        producto.setFuente("PROV");
        producto.setFechaActualizacion(LocalDateTime.now());
        return productoRepo.save(producto);
    }

    private Marca buscarOCrearMarca(String nombre) { return marcaRepo.findByNombre(nombre.trim()).orElseGet(() -> { Marca m = new Marca(); m.setNombre(nombre.trim()); return marcaRepo.save(m); }); }
    private Categoria buscarOCrearCategoria(String nombre) { return categoriaRepo.findByNombre(nombre.trim()).orElseGet(() -> { Categoria c = new Categoria(); c.setNombre(nombre.trim()); return categoriaRepo.save(c); }); }
    private String generarSku() { return "NTK-" + String.format("%06d", productoRepo.count() + 1); }
    private boolean esVacio(String valor) { return valor == null || valor.isBlank(); }
    private Integer valorNoNegativo(Integer valor) { return valor == null ? 0 : Math.max(0, valor); }
}
