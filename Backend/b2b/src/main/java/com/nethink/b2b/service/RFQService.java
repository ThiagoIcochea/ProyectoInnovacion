package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.ItemRFQRequest;
import com.nethink.b2b.dto.request.RFQRequest;
import com.nethink.b2b.dto.response.ItemCotizadoResponse;
import com.nethink.b2b.dto.response.RFQProveedorResponse;
import com.nethink.b2b.entity.DescuentoVolumen;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.repository.DescuentoVolumenRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RFQService {

    private final ProveedorProductoRepository provProdRepo;
    private final ScoringService scoringService;
    private final InventarioReservaService inventarioReSer;
    private final DescuentoVolumenRepository descuentoVolumenRepo;

    public RFQService(ProveedorProductoRepository provProdRepo, ScoringService scoringService,InventarioReservaService inventarioReSer, DescuentoVolumenRepository descuentoVolumenRepo) {
        this.provProdRepo = provProdRepo;
        this.scoringService = scoringService;
        this.inventarioReSer=  inventarioReSer;
        this.descuentoVolumenRepo= descuentoVolumenRepo;
    }

    public List<RFQProveedorResponse> buscarYCalificarProveedores(RFQRequest request) {
        List<Integer> idsProductos = request.getItems().stream()
                .map(ItemRFQRequest::getIdProducto)
                .toList();

        List<Integer> proveedoresIds = provProdRepo.findProveedoresConTodosLosProductos(
                idsProductos, 
                idsProductos.size()
        );

        if (proveedoresIds.isEmpty()) return new ArrayList<>();

        List<ProveedorProducto> detalles = provProdRepo.findDetallesParaScoring(proveedoresIds, idsProductos);
        Map<Integer, List<ProveedorProducto>> porProveedor = detalles.stream()
                .collect(Collectors.groupingBy(pp -> pp.getProveedor().getIdProveedor()));

        List<RFQProveedorResponse> candidatos = new ArrayList<>();

        for (Map.Entry<Integer, List<ProveedorProducto>> entry : porProveedor.entrySet()) {
            List<ProveedorProducto> stockProv = entry.getValue();
            double totalCotizacion = 0;
            int tiempoMaximo = 0;
            boolean cumpleStock = true;
            
            List<ItemCotizadoResponse> itemsDetalle = new ArrayList<>();

            for (ItemRFQRequest itemReq : request.getItems()) {
                ProveedorProducto pp = stockProv.stream()
                        .filter(p -> p.getProducto().getIdProducto().equals(itemReq.getIdProducto()))
                        .findFirst().orElse(null);

                if (pp != null && inventarioReSer.calcularStockDisponible(pp) >= itemReq.getCantidad()) {
                    
                    double precioBase = pp.getPrecio().doubleValue();
double precioFinal = precioBase;

/* =========================
   1. DESCUENTO VOLUMEN (PRIORIDAD 1)
   ========================= */
List<DescuentoVolumen> volumenes =
        descuentoVolumenRepo.findByProveedorProducto_IdProvProd(pp.getIdProvProd());

DescuentoVolumen mejor = volumenes.stream()
        .filter(v -> itemReq.getCantidad() >= v.getCantidadMin())
        .max(Comparator.comparingInt(DescuentoVolumen::getCantidadMin))
        .orElse(null);

if (mejor != null) {

    // SI HAY VOLUMEN → ESTE GANA
    precioFinal = mejor.getPrecioUnitario().doubleValue();

} else {

    /* =========================
       2. DESCUENTO PRODUCTO
       ========================= */
    if (pp.getPorcentajeDescuento() != null && pp.getPorcentajeDescuento() > 0) {
        precioFinal -= precioBase * pp.getPorcentajeDescuento() / 100;
    }
}

/* =========================
   3. SUBTOTAL
   ========================= */
double subtotal = precioFinal * itemReq.getCantidad();
totalCotizacion += subtotal;
                    
                    if (pp.getTiempoEntregaDias() > tiempoMaximo) tiempoMaximo = pp.getTiempoEntregaDias();

                    ItemCotizadoResponse itemDetalle = new ItemCotizadoResponse();
                    itemDetalle.setIdProducto(pp.getProducto().getIdProducto());
itemDetalle.setProducto(pp.getProducto().getNombre());
itemDetalle.setNombreProducto(pp.getProducto().getNombre());
itemDetalle.setCantidad(itemReq.getCantidad());

// 🔵 precios base y final
itemDetalle.setPrecioBase(precioBase);
itemDetalle.setPrecioUnitario(precioFinal);
itemDetalle.setSubtotal(subtotal);

// 🔥 DETALLE DE DESCUENTO
if (mejor != null) {

    itemDetalle.setTipoDescuento("VOLUMEN");
    itemDetalle.setValorDescuento(
        mejor.getPrecioUnitario().doubleValue()
    );

} else if (pp.getPorcentajeDescuento() != null && pp.getPorcentajeDescuento() > 0) {

    itemDetalle.setTipoDescuento("PRODUCTO");
    itemDetalle.setValorDescuento(pp.getPorcentajeDescuento());

} else {

    itemDetalle.setTipoDescuento("NINGUNO");
    itemDetalle.setValorDescuento(0.0);
}
                } else {
                    cumpleStock = false;
                    break;
                }
            }

            if (cumpleStock) {
                if (request.getFiltro().getPrecioMin() != null && totalCotizacion < request.getFiltro().getPrecioMin()) continue;
                if (request.getFiltro().getPrecioMax() != null && totalCotizacion > request.getFiltro().getPrecioMax()) continue;

                RFQProveedorResponse resp = new RFQProveedorResponse();
                resp.setIdProveedor(entry.getKey());
                resp.setNombreProveedor(stockProv.get(0).getProveedor().getRazonSocial());
                resp.setRazonSocial(stockProv.get(0).getProveedor().getRazonSocial());
                resp.setTotalCotizacion(totalCotizacion);
                resp.setTiempoEntregaPromedio(tiempoMaximo);
                resp.setItems(itemsDetalle); 
                candidatos.add(resp);
            }
        }

        scoringService.calcularScore(candidatos, request.getPrioridad());

        return candidatos.stream()
                .sorted(Comparator.comparingDouble(RFQProveedorResponse::getScoreFinal).reversed())
                .limit(10)
                .toList();
    }
}
