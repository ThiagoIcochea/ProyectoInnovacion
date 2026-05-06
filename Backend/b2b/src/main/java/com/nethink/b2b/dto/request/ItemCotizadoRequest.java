package com.nethink.b2b.dto.request;


public record ItemCotizadoRequest(
    Integer idProducto,
    Integer cantidad,
    Double precioUnitario
) {}
