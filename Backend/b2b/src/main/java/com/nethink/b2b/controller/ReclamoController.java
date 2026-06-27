package com.nethink.b2b.controller;

import com.nethink.b2b.service.SolicitudService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/reclamos")
public class ReclamoController {

    private final SolicitudService solicitudService;

    public ReclamoController(SolicitudService solicitudService) {
        this.solicitudService = solicitudService;
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
}
