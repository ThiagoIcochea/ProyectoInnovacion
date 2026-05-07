package com.nethink.b2b.dto.request;

import java.math.BigDecimal;
import java.util.List;

public record SolicitudCrearRequest(

        Integer idProveedor,
        List<ItemCotizadoRequest> items,
        String direccionEnvio

) {}