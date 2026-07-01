package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.SuscripcionRequest;
import com.nethink.b2b.dto.response.PayPalOrderResponse;
import com.nethink.b2b.dto.response.SuscripcionStatusResponse;
import com.nethink.b2b.service.SuscripcionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/suscripciones")
@CrossOrigin(origins = "*")
public class SuscripcionController {

    @Autowired
    private SuscripcionService suscripcionService;

    // 1. Crear orden de pago (redirige a PayPal)
    @PostMapping("/crear-orden")
    public ResponseEntity<PayPalOrderResponse> crearOrden(
            @RequestBody SuscripcionRequest req) {

        PayPalOrderResponse response =
                suscripcionService.crearOrden(req);

        return ResponseEntity.ok(response);
    }

    // 2. Capturar pago después de PayPal
    @PostMapping("/capturar/{orderId}")
    public ResponseEntity<?> capturarPago(
            @PathVariable String orderId,
            @RequestParam(required = false) Integer meses) {

        suscripcionService.capturarPago(orderId, meses);

        return ResponseEntity.ok(
                Map.of(
                        "status", "ACTIVA",
                        "message", "Pago confirmado correctamente"
                )
        );
    }

    @GetMapping("/estado/{idUsuario}")
    public ResponseEntity<SuscripcionStatusResponse> obtenerEstado(
            @PathVariable Integer idUsuario) {
        return ResponseEntity.ok(suscripcionService.obtenerEstadoSuscripcion(idUsuario));
    }
}