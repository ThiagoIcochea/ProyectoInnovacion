package com.nethink.b2b.dto.request;

import java.util.List;


public record SolicitudCrearRequest(
    Integer idProveedor,
    Double subtotal,
    Double igv,
    Double total,
    String direccionEnvio,
    List<ItemCotizadoRequest> items
) {}
