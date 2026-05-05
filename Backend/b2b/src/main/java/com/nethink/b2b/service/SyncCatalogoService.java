package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.*;
import com.nethink.b2b.entity.*;
import com.nethink.b2b.repository.*;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.List;
import java.util.Optional;

@Service
public class SyncCatalogoService {

    private final ProductoRepository productoRepo;
    private final MarcaRepository marcaRepo;
    private final CategoriaRepository categoriaRepo;
    private final ProveedorRepository proveedorRepo;
    private final ProveedorProductoRepository provProdRepo;
    private final ProductoEspecificacionRepository specRepo;
    private final DescuentoVolumenRepository descRepo;
    private final LogsApiRepository logsApiRepo;
    private final LogsSistemaRepository logsSistemaRepo;
    private final RestTemplate restTemplate;
    private final ProductoImagenRepository imagenRepo;

    public SyncCatalogoService(
            ProductoRepository productoRepo, MarcaRepository marcaRepo, CategoriaRepository categoriaRepo, ProveedorRepository proveedorRepo, ProveedorProductoRepository provProdRepo, ProductoEspecificacionRepository specRepo, DescuentoVolumenRepository descRepo, LogsApiRepository logsApiRepo, LogsSistemaRepository logsSistemaRepo, RestTemplate restTemplate, ProductoImagenRepository imagenRepo, ProductoImagenRepository imagenRepo1) {

        this.productoRepo = productoRepo;
        this.marcaRepo = marcaRepo;
        this.categoriaRepo = categoriaRepo;
        this.proveedorRepo = proveedorRepo;
        this.provProdRepo = provProdRepo;
        this.specRepo = specRepo;
        this.descRepo = descRepo;
        this.logsApiRepo = logsApiRepo;
        this.logsSistemaRepo = logsSistemaRepo;
        this.restTemplate = restTemplate;
        this.imagenRepo = imagenRepo1;
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

        Optional<Producto> productoOpt = productoRepo
                .findByNombreAndMarca_IdMarca(dto.getProducto(), marca.getIdMarca());

        Producto producto;

        if (productoOpt.isPresent()) {
            producto = productoOpt.get();
        } else {
            producto = new Producto();
            producto.setNombre(dto.getProducto());
            producto.setMarca(marca);
            producto.setCategoria(categoria);
            productoRepo.save(producto);

            LogsSistema log = new LogsSistema();
            log.setAccion("CREAR");
            log.setModulo("PRODUCTO");
            log.setDescripcion("Producto creado: " + dto.getProducto());
            logsSistemaRepo.save(log);
        }

        producto.setCategoria(categoria);
        productoRepo.save(producto);

        Proveedor proveedor = proveedorRepo.findByRazonSocial(dto.getProveedor())
                .orElseThrow(() -> new RuntimeException("Proveedor no existe"));

        Optional<ProveedorProducto> ppOpt = provProdRepo
                .findByProveedor_IdProveedorAndProducto_IdProducto(
                        proveedor.getIdProveedor(),
                        producto.getIdProducto()
                );

        ProveedorProducto pp;

        if (ppOpt.isPresent()) {
            pp = ppOpt.get();

            if (pp.getPrecio() != null && !pp.getPrecio().equals(dto.getPrecio())) {
                LogsSistema log = new LogsSistema();
                log.setAccion("UPDATE");
                log.setModulo("PRECIO");
                log.setDescripcion("Cambio precio: " + pp.getPrecio() + " → " + dto.getPrecio());
                logsSistemaRepo.save(log);
            }

        } else {
            pp = new ProveedorProducto();
            pp.setProveedor(proveedor);
            pp.setProducto(producto);

            LogsSistema log = new LogsSistema();
            log.setAccion("CREAR");
            log.setModulo("PROVEEDOR_PRODUCTO");
            log.setDescripcion("Relación creada: " + dto.getProducto());
            logsSistemaRepo.save(log);
        }

        pp.setPrecio(dto.getPrecio());
        pp.setStock(dto.getStock());
        pp.setTiempoEntregaDias(dto.getTiempoEntrega());
        pp.setPorcentajeDescuento(dto.getPorcentajeDescuento());

        provProdRepo.save(pp);

        specRepo.deleteByProducto_IdProducto(producto.getIdProducto());

        if (dto.getEspecificaciones() != null) {
            dto.getEspecificaciones().forEach(e -> {
                ProductoEspecificacion spec = new ProductoEspecificacion();
                spec.setProducto(producto);
                spec.setNombre(e.getNombre());
                spec.setValor(e.getValor());
                specRepo.save(spec);
            });
        }

        descRepo.deleteByProveedorProducto_IdProvProd(pp.getIdProvProd());

        if (dto.getDescuentosVolumen() != null) {
            dto.getDescuentosVolumen().forEach(d -> {
                DescuentoVolumen dv = new DescuentoVolumen();
                dv.setProveedorProducto(pp);
                dv.setCantidadMin(d.getCantidadMin());
                dv.setPrecioUnitario(d.getPrecioUnitario());
                descRepo.save(dv);
            });
        }
        
         imagenRepo.deleteByProducto_IdProducto(producto.getIdProducto());

if (dto.getImagenes() != null) {
    int orden = 1;

    for (ImagenResponse img : dto.getImagenes()) {
        ProductoImagen pi = new ProductoImagen();
        pi.setProducto(producto);
        pi.setUrl(img.getUrl());
        pi.setPrincipal(img.getPrincipal() != null ? img.getPrincipal() : false);
        pi.setOrden(orden++);
        pi.setFuente("API");

        imagenRepo.save(pi);
    }
}
    }

    public void sincronizarDesdeApi(Proveedor proveedor) {

        String url = proveedor.getApiUrl();
        String tipo = proveedor.getApiTipo();
        String token = proveedor.getApiToken();

        long inicio = System.currentTimeMillis();

        try {

            CatalogoResponse[] data;

            if ("GRAPHQL".equalsIgnoreCase(tipo)) {
                data = consumirGraphQL(url, token);
            } else {
                data = consumirREST(url, token);
            }

            if (data != null) {
                for (CatalogoResponse dto : data) {
                    sync(dto);
                }
            }

            LogsApi log = new LogsApi();
            log.setProveedor(proveedor);
            log.setEndpoint(url);
            log.setMetodoHttp("POST");
            log.setCodigoRespuesta("200");
            log.setTiempoRespuestaMs((int)(System.currentTimeMillis() - inicio));
            log.setEstado(LogsApi.Estado.OK);
            log.setDescripcion("Sincronización correcta");

            logsApiRepo.save(log);

        } catch (Exception e) {

            LogsApi log = new LogsApi();
            log.setProveedor(proveedor);
            log.setEndpoint(url);
            log.setMetodoHttp("POST");
            log.setCodigoRespuesta("500");
            log.setTiempoRespuestaMs((int)(System.currentTimeMillis() - inicio));
            log.setEstado(LogsApi.Estado.ERROR);
            log.setDescripcion(e.getMessage());

            logsApiRepo.save(log);
        }
    }

    private CatalogoResponse[] consumirREST(String url, String token) {

        HttpHeaders headers = new HttpHeaders();

        if (token != null && !token.isEmpty()) {
            headers.set("Authorization", "Bearer " + token);
        }

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<CatalogoResponse[]> response =
                restTemplate.exchange(url, HttpMethod.GET, entity, CatalogoResponse[].class);

        return response.getBody();
    }

    private CatalogoResponse[] consumirGraphQL(String url, String token) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        if (token != null && !token.isEmpty()) {
            headers.set("Authorization", "Bearer " + token);
        }

        String query = "{ productos { producto marca categoria proveedor precio stock tiempoEntrega porcentajeDescuento } }";

        String body = "{ \"query\": \"" + query + "\" }";

        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response =
                restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        return new CatalogoResponse[]{};
    }

    public void sincronizarTodos() {
        List<Proveedor> proveedores = proveedorRepo.findAll();
        for (Proveedor p : proveedores) {
            sincronizarDesdeApi(p);
        }
    }
}