package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.ReclamoRequest;
import com.nethink.b2b.service.ReclamoService;
import com.nethink.b2b.service.SolicitudService;
import java.io.IOException;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/reclamos")
public class ReclamoController {

    private final SolicitudService solicitudService;
    
    private final ReclamoService reclamoService;

    public ReclamoController(SolicitudService solicitudService, ReclamoService reclamoService) {
        this.solicitudService = solicitudService;
        this.reclamoService = reclamoService;
    }

  
   @PostMapping(
    value="/demora",
    consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
public ResponseEntity<?> crear(

        @ModelAttribute ReclamoRequest request,
        Principal principal

) throws IOException {

    reclamoService.registrarReclamo(
            request,
            principal.getName());

    return ResponseEntity.ok().build();
}
}
