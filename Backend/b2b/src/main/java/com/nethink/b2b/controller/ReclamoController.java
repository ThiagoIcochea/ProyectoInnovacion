package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.ReclamoRequest;
import com.nethink.b2b.service.ReclamoService;
import com.nethink.b2b.service.SolicitudService;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/reclamos")
public class ReclamoController {

    private final SolicitudService solicitudService;
    
    private final ReclamoService reclamoService;

    public ReclamoController(SolicitudService solicitudService, ReclamoService reclamoService) {
        this.solicitudService = solicitudService;
        this.reclamoService = reclamoService;
    }

  
    
      @PostMapping("/demora")
    public ResponseEntity<?> registrar(
            @RequestBody ReclamoRequest request,
            Principal p
    ) {

        reclamoService.registrarReclamo(
                request,
                p.getName());

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Reclamo registrado"
                ));
    }
}
