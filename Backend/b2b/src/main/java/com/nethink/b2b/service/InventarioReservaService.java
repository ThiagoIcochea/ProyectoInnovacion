package com.nethink.b2b.service;

import com.nethink.b2b.entity.*;
import com.nethink.b2b.repository.InventarioReservaRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InventarioReservaService {

    private final InventarioReservaRepository reservaRepo;
    private final ProveedorProductoRepository proveedorProductoRepo;
    private final RestTemplate restTemplate = new RestTemplate();

    public InventarioReservaService(
            InventarioReservaRepository reservaRepo,
            ProveedorProductoRepository proveedorProductoRepo
    ) {
        this.reservaRepo = reservaRepo;
        this.proveedorProductoRepo = proveedorProductoRepo;
    }

    public InventarioReserva crearReserva(
            Solicitud solicitud,
            ProveedorProducto pp,
            Integer cantidad
    ) {
        InventarioReserva r = new InventarioReserva();

        r.setSolicitud(solicitud);
        r.setProveedorProducto(pp);
        r.setCantidad(cantidad);
        r.setEstado("RESERVADO");
        r.setFechaCreacion(LocalDateTime.now());

        return reservaRepo.save(r);
    }

    @Transactional
    public void confirmarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);

        for (InventarioReserva r : reservas) {
            r.setEstado("CONFIRMADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);
        }
    }

    @Transactional
    public void liberarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);

        for (InventarioReserva r : reservas) {
            r.setEstado("LIBERADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);
        }
    }

    @Transactional
    public void entregarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);
        List<ProveedorProducto> productosActualizados = new ArrayList<>();

        for (InventarioReserva r : reservas) {
            if (!esReservaActiva(r)) {
                continue;
            }

            ProveedorProducto pp = r.getProveedorProducto();
            int stockActual = pp.getStock() != null ? pp.getStock() : 0;
            int cantidad = r.getCantidad() != null ? r.getCantidad() : 0;

            pp.setStock(Math.max(0, stockActual - cantidad));
            pp.setUltimaActualizacionStock(LocalDateTime.now());
            proveedorProductoRepo.save(pp);
            productosActualizados.add(pp);

            r.setEstado("ENTREGADO");
            r.setFechaActualizacion(LocalDateTime.now());
            reservaRepo.save(r);
        }

        sincronizarInventarioProveedor(productosActualizados);
    }

    @Transactional
    public void cancelarReserva(Integer idSolicitud) {
        List<InventarioReserva> reservas =
                reservaRepo.findBySolicitud_IdSolicitud(idSolicitud);

        reservaRepo.deleteAll(reservas);
    }
    
    public Integer calcularStockDisponible(ProveedorProducto pp) {

    int stockApi = pp.getStock(); 

    int reservado = reservaRepo.sumarReservasActivas(
            pp.getIdProvProd()
    );

    return stockApi - reservado;
}

private boolean esReservaActiva(InventarioReserva reserva) {
    if (reserva == null || reserva.getEstado() == null) {
        return false;
    }

    return "RESERVADO".equals(reserva.getEstado())
            || "CONFIRMADO".equals(reserva.getEstado());
}

private void sincronizarInventarioProveedor(List<ProveedorProducto> productosActualizados) {
    if (productosActualizados == null || productosActualizados.isEmpty()) {
        return;
    }

    Proveedor proveedor = productosActualizados.get(0).getProveedor();
    if (proveedor == null || proveedor.getApiUrl() == null || proveedor.getApiUrl().isBlank()) {
        return;
    }

    try {
        enviarInventario(proveedor, HttpMethod.PATCH, productosActualizados);
    } catch (Exception patchError) {
        try {
            List<ProveedorProducto> catalogoActual =
                    proveedorProductoRepo.findByProveedor_IdProveedor(proveedor.getIdProveedor());
            enviarInventario(proveedor, HttpMethod.POST, catalogoActual);
        } catch (Exception postError) {
            System.out.println("Error sincronizando inventario proveedor "
                    + proveedor.getIdProveedor() + ": " + postError.getMessage());
        }
    }
}

private void enviarInventario(
        Proveedor proveedor,
        HttpMethod metodo,
        List<ProveedorProducto> productos
) {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    if (proveedor.getApiToken() != null && !proveedor.getApiToken().isBlank()) {
        headers.setBearerAuth(proveedor.getApiToken());
    }

    Map<String, Object> body = new HashMap<>();
    body.put("idProveedor", proveedor.getIdProveedor());
    body.put("razonSocial", proveedor.getRazonSocial());
    body.put("fechaActualizacion", LocalDateTime.now().toString());
    body.put("productos", productos.stream().map(this::mapProductoInventario).toList());

    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
    ResponseEntity<String> response = restTemplate.exchange(
            proveedor.getApiUrl(),
            metodo,
            entity,
            String.class
    );

    if (!response.getStatusCode().is2xxSuccessful()) {
        throw new RuntimeException("API proveedor respondio " + response.getStatusCode().value());
    }
}

private Map<String, Object> mapProductoInventario(ProveedorProducto pp) {
    Producto producto = pp.getProducto();

    Map<String, Object> item = new HashMap<>();
    item.put("idProvProd", pp.getIdProvProd());
    item.put("idProducto", producto != null ? producto.getIdProducto() : null);
    item.put("sku", producto != null ? producto.getSkuGlobal() : null);
    item.put("producto", producto != null ? producto.getNombre() : null);
    item.put("marca", producto != null && producto.getMarca() != null ? producto.getMarca().getNombre() : null);
    item.put("categoria", producto != null && producto.getCategoria() != null ? producto.getCategoria().getNombre() : null);
    item.put("precioUnitario", pp.getPrecio());
    item.put("stock", pp.getStock());
    item.put("estado", pp.getEstado());
    item.put(
            "ultimaActualizacionStock",
            pp.getUltimaActualizacionStock() != null ? pp.getUltimaActualizacionStock().toString() : null
    );
    return item;
}
}
