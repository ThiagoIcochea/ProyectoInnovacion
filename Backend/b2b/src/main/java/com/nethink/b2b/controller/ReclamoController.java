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
    public ResponseEntity<?> reclamoDemora(@RequestBody Map<String, Object> payload) {
        Integer idSolicitud = payload.get("idSolicitud") == null ? null : Integer.valueOf(payload.get("idSolicitud").toString());
        String descripcion = payload.getOrDefault("descripcion", "").toString();
        String evidencia = payload.getOrDefault("evidencia", "").toString();

        if (idSolicitud == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "idSolicitud requerido"));
        }

        solicitudService.enviarReclamoDemora(idSolicitud, descripcion, evidencia);

        return ResponseEntity.ok(Map.of("message", "Reclamo registrado y notificado"));
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
