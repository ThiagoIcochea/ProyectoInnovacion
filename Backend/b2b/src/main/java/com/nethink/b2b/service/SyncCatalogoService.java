package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.CatalogoResponse;
import com.nethink.b2b.dto.response.CatalogoWrapperResponse;
import com.nethink.b2b.dto.response.DescuentoVolumenResponse;
import com.nethink.b2b.dto.response.EspecificacionResponse;
import com.nethink.b2b.dto.response.GraphQLCatalogoResponse;
import com.nethink.b2b.dto.response.ImagenResponse;
import com.nethink.b2b.entity.Categoria;
import com.nethink.b2b.entity.DescuentoVolumen;
import com.nethink.b2b.entity.Marca;
import com.nethink.b2b.entity.Producto;
import com.nethink.b2b.entity.ProductoEspecificacion;
import com.nethink.b2b.entity.ProductoImagen;
import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.repository.CategoriaRepository;
import com.nethink.b2b.repository.DescuentoVolumenRepository;
import com.nethink.b2b.repository.MarcaRepository;
import com.nethink.b2b.repository.ProductoEspecificacionRepository;
import com.nethink.b2b.repository.ProductoImagenRepository;
import com.nethink.b2b.repository.ProductoRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SyncCatalogoService {

    private final ProductoRepository productoRepo;
    private final MarcaRepository marcaRepo;
    private final CategoriaRepository categoriaRepo;
    private final ProductoEspecificacionRepository specRepo;
    private final ProductoImagenRepository imagenRepo;
    private final ProveedorProductoRepository proveedorProductoRepo;
    private final DescuentoVolumenRepository descuentoRepo;

    private final RestTemplate restTemplate;

    public SyncCatalogoService(
            ProductoRepository productoRepo,
            MarcaRepository marcaRepo,
            CategoriaRepository categoriaRepo,
            ProductoEspecificacionRepository specRepo,
            ProductoImagenRepository imagenRepo,
            ProveedorProductoRepository proveedorProductoRepo,
            DescuentoVolumenRepository descuentoRepo
    ) {

        this.productoRepo = productoRepo;
        this.marcaRepo = marcaRepo;
        this.categoriaRepo = categoriaRepo;
        this.specRepo = specRepo;
        this.imagenRepo = imagenRepo;
        this.proveedorProductoRepo = proveedorProductoRepo;
        this.descuentoRepo = descuentoRepo;

        this.restTemplate = new RestTemplate();
    }

    public void sincronizarProveedor(
            Proveedor proveedor
    ) {

        try {

            System.out.println(
                    "Conectando con proveedor: "
                            + proveedor.getRazonSocial()
            );

            List<CatalogoResponse> catalogo;

            if ("GRAPHQL".equalsIgnoreCase(
                    proveedor.getApiTipo()
            )) {

                catalogo = consumirGraphQL(
                        proveedor
                );

            } else {

                catalogo = consumirRest(
                        proveedor
                );
            }

            if (catalogo == null || catalogo.isEmpty()) {

                System.out.println(
                        "Proveedor sin catálogo: "
                                + proveedor.getRazonSocial()
                );

                return;
            }

            for (CatalogoResponse dto : catalogo) {

                sync(dto, proveedor);
            }

            System.out.println(
                    "Sincronización completada: "
                            + proveedor.getRazonSocial()
            );

        } catch (Exception e) {

            System.out.println(
                    "No se pudo conectar con proveedor: "
                            + proveedor.getRazonSocial()
            );

            e.printStackTrace();
        }
    }

    private List<CatalogoResponse> consumirRest(
            Proveedor proveedor
    ) {

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        if (proveedor.getApiToken() != null
                && !proveedor.getApiToken().isBlank()) {

            headers.setBearerAuth(
                    proveedor.getApiToken()
            );
        }

        HttpEntity<String> entity =
                new HttpEntity<>(headers);

        ResponseEntity<CatalogoWrapperResponse> response =
                restTemplate.exchange(
                        proveedor.getApiUrl(),
                        HttpMethod.GET,
                        entity,
                        CatalogoWrapperResponse.class
                );

        if (response.getBody() == null
                || response.getBody().getRecord() == null) {

            return Collections.emptyList();
        }

        return response.getBody()
                .getRecord()
                .getCatalogo();
    }

    private List<CatalogoResponse> consumirGraphQL(
            Proveedor proveedor
    ) {

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        if (proveedor.getApiToken() != null
                && !proveedor.getApiToken().isBlank()) {

            headers.setBearerAuth(
                    proveedor.getApiToken()
            );
        }

        String query = """
        {
          "query": "query { catalogo { sku producto marca categoria descripcion precioUnitario stock garantiaMeses tiempoEntregaDias enOferta porcentajeDescuento estado imagenes { url principal orden } especificaciones { nombre valor } descuentosVolumen { cantidadMin precioUnitario } } }"
        }
        """;

        HttpEntity<String> entity =
                new HttpEntity<>(query, headers);

        ResponseEntity<GraphQLCatalogoResponse> response =
                restTemplate.exchange(
                        proveedor.getApiUrl(),
                        HttpMethod.POST,
                        entity,
                        GraphQLCatalogoResponse.class
                );

        if (response.getBody() == null
                || response.getBody().getData() == null) {

            return Collections.emptyList();
        }

        return response.getBody()
                .getData()
                .getCatalogo();
    }

    public void sync(
            CatalogoResponse dto,
            Proveedor proveedor
    ) {

        Marca marca =
                obtenerOCrearMarca(
                        dto.getMarca()
                );

        Categoria categoria =
                obtenerOCrearCategoria(
                        dto.getCategoria()
                );

        Producto producto =
                buscarProductoExistente(
                        dto,
                        marca,
                        categoria
                );

        boolean productoNuevo = false;

        if (producto == null) {

            producto =
                    crearProducto(
                            dto,
                            marca,
                            categoria,
                            proveedor
                    );

            productoNuevo = true;

        } else {

            actualizarProducto(
                    producto,
                    dto,
                    marca,
                    categoria,
                    proveedor
            );
        }

        /*
            Si el proveedor NO tiene SKU,
            se genera y se intenta actualizar
            en la API externa
        */
        actualizarSkuEnProveedor(
                proveedor,
                dto,
                producto
        );

        /*
            SOLO si el producto es nuevo
            se registran imágenes y specs
            porque pertenecen al producto genérico
        */
        if (productoNuevo) {

            sincronizarEspecificaciones(
                    producto,
                    dto.getEspecificaciones()
            );

            sincronizarImagenes(
                    producto,
                    dto.getImagenes()
            );
        }

        /*
            Esto SIEMPRE se sincroniza
            porque depende del proveedor
        */
        sincronizarProveedorProducto(
                producto,
                proveedor,
                dto
        );
    }

    private Marca obtenerOCrearMarca(
            String nombre
    ) {

        return marcaRepo.findByNombre(nombre)
                .orElseGet(() -> {

                    Marca marca = new Marca();

                    marca.setNombre(nombre);

                    return marcaRepo.save(marca);
                });
    }

    private Categoria obtenerOCrearCategoria(
            String nombre
    ) {

        return categoriaRepo.findByNombre(nombre)
                .orElseGet(() -> {

                    Categoria categoria =
                            new Categoria();

                    categoria.setNombre(nombre);

                    return categoriaRepo.save(
                            categoria
                    );
                });
    }

    private Producto buscarProductoExistente(
            CatalogoResponse dto,
            Marca marca,
            Categoria categoria
    ) {

        /*
            1. Buscar por SKU global
        */
        if (dto.getSku() != null
                && !dto.getSku().isBlank()) {

            Optional<Producto> porSku =
                    productoRepo.findBySkuGlobal(
                            dto.getSku()
                    );

            if (porSku.isPresent()) {
                return porSku.get();
            }
        }

        /*
            2. Buscar por nombre + marca
        */
        Optional<Producto> producto =
                productoRepo.findByNombreAndMarca_IdMarca(
                        dto.getProducto(),
                        marca.getIdMarca()
                );

        if (producto.isPresent()) {

            Producto existente = producto.get();

            boolean categoriaIgual =
                    existente.getCategoria()
                            .getIdCategoria()
                            .equals(
                                    categoria.getIdCategoria()
                            );

            boolean specsIguales =
                    compararEspecificaciones(
                            existente.getIdProducto(),
                            dto.getEspecificaciones()
                    );

            /*
                Si coincide categoría
                o especificaciones,
                se considera el mismo producto genérico
            */
            if (categoriaIgual || specsIguales) {

                /*
                    Si el producto existente
                    no tenía SKU y ahora sí,
                    se actualiza
                */
                if ((existente.getSkuGlobal() == null
                        || existente.getSkuGlobal().isBlank())
                        &&
                        dto.getSku() != null
                        &&
                        !dto.getSku().isBlank()) {

                    existente.setSkuGlobal(
                            dto.getSku()
                    );

                    productoRepo.save(existente);
                }

                return existente;
            }
        }

        return null;
    }

    private boolean compararEspecificaciones(
            Integer idProducto,
            List<EspecificacionResponse> nuevas
    ) {

        List<ProductoEspecificacion> actuales =
                specRepo.findByProducto_IdProducto(
                        idProducto
                );

        if (nuevas == null || actuales.isEmpty()) {
            return false;
        }

        int coincidencias = 0;

        for (EspecificacionResponse nueva : nuevas) {

            for (ProductoEspecificacion actual
                    : actuales) {

                boolean nombre =
                        actual.getNombre()
                                .equalsIgnoreCase(
                                        nueva.getNombre()
                                );

                boolean valor =
                        actual.getValor()
                                .equalsIgnoreCase(
                                        nueva.getValor()
                                );

                if (nombre && valor) {
                    coincidencias++;
                }
            }
        }

        return coincidencias >= 2;
    }

    private Producto crearProducto(
            CatalogoResponse dto,
            Marca marca,
            Categoria categoria,
            Proveedor proveedor
    ) {

        Producto producto = new Producto();

        producto.setNombre(
                dto.getProducto()
        );

        producto.setDescripcion(
                dto.getDescripcion()
        );

        producto.setMarca(marca);

        producto.setCategoria(categoria);

        producto.setEstado(
                dto.getEstado() != null
                        ? dto.getEstado()
                        : "ACTIVO"
        );

        producto.setFuente("API");

        producto.setApiOrigen(
                proveedor.getApiUrl()
        );

        producto.setFechaActualizacion(
                LocalDateTime.now()
        );

        if (dto.getSku() != null
                && !dto.getSku().isBlank()) {

            producto.setSkuGlobal(
                    dto.getSku()
            );
        }

        Producto guardado =
                productoRepo.save(producto);

        /*
            Si proveedor no manda SKU,
            se genera automáticamente
        */
        if (guardado.getSkuGlobal() == null
                || guardado.getSkuGlobal().isBlank()) {

            guardado.setSkuGlobal(
                    "NTK-"
                            + String.format(
                            "%06d",
                            guardado.getIdProducto()
                    )
            );

            guardado =
                    productoRepo.save(guardado);
        }

        return guardado;
    }

    private void actualizarProducto(
            Producto producto,
            CatalogoResponse dto,
            Marca marca,
            Categoria categoria,
            Proveedor proveedor
    ) {

        producto.setNombre(
                dto.getProducto()
        );

        producto.setDescripcion(
                dto.getDescripcion()
        );

        producto.setMarca(marca);

        producto.setCategoria(categoria);

        producto.setEstado(
                dto.getEstado() != null
                        ? dto.getEstado()
                        : producto.getEstado()
        );

        producto.setApiOrigen(
                proveedor.getApiUrl()
        );

        producto.setFechaActualizacion(
                LocalDateTime.now()
        );

        productoRepo.save(producto);
    }

    private void sincronizarEspecificaciones(
            Producto producto,
            List<EspecificacionResponse> specs
    ) {

        specRepo.deleteByProducto_IdProducto(
                producto.getIdProducto()
        );

        if (specs == null) {
            return;
        }

        for (EspecificacionResponse e : specs) {

            ProductoEspecificacion spec =
                    new ProductoEspecificacion();

            spec.setProducto(producto);

            spec.setNombre(e.getNombre());

            spec.setValor(e.getValor());

            specRepo.save(spec);
        }
    }

    private void sincronizarImagenes(
            Producto producto,
            List<ImagenResponse> imagenes
    ) {

        imagenRepo.deleteByProducto_IdProducto(
                producto.getIdProducto()
        );

        if (imagenes == null) {
            return;
        }

        int orden = 1;

        for (ImagenResponse img : imagenes) {

            ProductoImagen imagen =
                    new ProductoImagen();

            imagen.setProducto(producto);

            imagen.setUrl(img.getUrl());

            imagen.setPrincipal(
                    Boolean.TRUE.equals(
                            img.getPrincipal()
                    )
            );

            imagen.setOrden(orden++);

            imagenRepo.save(imagen);
        }
    }

    private void sincronizarProveedorProducto(
            Producto producto,
            Proveedor proveedor,
            CatalogoResponse dto
    ) {

        ProveedorProducto proveedorProducto =
                proveedorProductoRepo
                        .buscarPorProveedorYProducto(
                                proveedor.getIdProveedor(),
                                producto.getIdProducto()
                        )
                        .orElseGet(() -> {

                            ProveedorProducto pp =
                                    new ProveedorProducto();

                            pp.setProveedor(proveedor);

                            pp.setProducto(producto);

                            return pp;
                        });

        proveedorProducto.setPrecio(
                dto.getPrecioUnitario()
        );

        proveedorProducto.setStock(
                dto.getStock()
        );

        proveedorProducto.setGarantiaMeses(
                dto.getGarantiaMeses()
        );

        proveedorProducto.setTiempoEntregaDias(
                dto.getTiempoEntregaDias()
        );

        proveedorProducto.setEnOferta(
                dto.getEnOferta()
        );

        proveedorProducto.setPorcentajeDescuento(
                dto.getPorcentajeDescuento()
        );

        proveedorProducto.setUltimaActualizacionStock(
                LocalDateTime.now()
        );

        proveedorProducto =
                proveedorProductoRepo.save(
                        proveedorProducto
                );

        sincronizarDescuentos(
                proveedorProducto,
                dto.getDescuentosVolumen()
        );
    }

    private void sincronizarDescuentos(
            ProveedorProducto proveedorProducto,
            List<DescuentoVolumenResponse> descuentos
    ) {

        descuentoRepo
                .deleteByProveedorProducto_IdProvProd(
                        proveedorProducto.getIdProvProd()
                );

        if (descuentos == null) {
            return;
        }

        for (DescuentoVolumenResponse d
                : descuentos) {

            DescuentoVolumen descuento =
                    new DescuentoVolumen();

            descuento.setProveedorProducto(
                    proveedorProducto
            );

            descuento.setCantidadMin(
                    d.getCantidadMin()
            );

            descuento.setPrecioUnitario(
                    d.getPrecioUnitario()
            );

            descuentoRepo.save(descuento);
        }
    }

    /*
        Actualiza SKU en proveedor externo
        SOLO si proveedor no tenía SKU
    */
    private void actualizarSkuEnProveedor(
            Proveedor proveedor,
            CatalogoResponse dto,
            Producto producto
    ) {

        try {

            if (dto.getSku() != null
                    && !dto.getSku().isBlank()) {

                return;
            }

            if ("GRAPHQL".equalsIgnoreCase(
                    proveedor.getApiTipo()
            )) {

                actualizarSkuGraphQL(
                        proveedor,
                        dto,
                        producto
                );

            } else {

                actualizarSkuRest(
                        proveedor,
                        dto,
                        producto
                );
            }

        } catch (Exception e) {

            System.out.println(
                    "No se pudo actualizar SKU en proveedor"
            );

            e.printStackTrace();
        }
    }

    private void actualizarSkuRest(
            Proveedor proveedor,
            CatalogoResponse dto,
            Producto producto
    ) {

        try {

            dto.setSku(
                    producto.getSkuGlobal()
            );

            HttpHeaders headers =
                    new HttpHeaders();

            headers.setContentType(
                    MediaType.APPLICATION_JSON
            );

            if (proveedor.getApiToken() != null
                    && !proveedor.getApiToken().isBlank()) {

                headers.setBearerAuth(
                        proveedor.getApiToken()
                );
            }

            Map<String, Object> body =
                    new HashMap<>();

            body.put(
                    "catalogo",
                    List.of(dto)
            );

            HttpEntity<Map<String, Object>> entity =
                    new HttpEntity<>(
                            body,
                            headers
                    );

            restTemplate.exchange(
                    proveedor.getApiUrl(),
                    HttpMethod.PUT,
                    entity,
                    String.class
            );

            System.out.println(
                    "SKU actualizado en proveedor REST"
            );

        } catch (Exception e) {

            System.out.println(
                    "Error actualizando SKU REST"
            );

            e.printStackTrace();
        }
    }

    private void actualizarSkuGraphQL(
            Proveedor proveedor,
            CatalogoResponse dto,
            Producto producto
    ) {

        try {

            HttpHeaders headers =
                    new HttpHeaders();

            headers.setContentType(
                    MediaType.APPLICATION_JSON
            );

            if (proveedor.getApiToken() != null
                    && !proveedor.getApiToken().isBlank()) {

                headers.setBearerAuth(
                        proveedor.getApiToken()
                );
            }

            String mutation = """
            {
              "query": "mutation { actualizarSku(idProducto: %d, sku: \\"%s\\") }"
            }
            """.formatted(
                    dto.getIdProducto(),
                    producto.getSkuGlobal()
            );

            HttpEntity<String> entity =
                    new HttpEntity<>(
                            mutation,
                            headers
                    );

            restTemplate.exchange(
                    proveedor.getApiUrl(),
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            System.out.println(
                    "SKU actualizado en proveedor GraphQL"
            );

        } catch (Exception e) {

            System.out.println(
                    "Error actualizando SKU GraphQL"
            );

            e.printStackTrace();
        }
    }
}