package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.ProfileUpdateRequest;
import com.nethink.b2b.dto.response.ProfileResponse;
import com.nethink.b2b.service.UsuarioService;
import java.security.Principal;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/perfil")
    public ResponseEntity<ProfileResponse> perfil(
            Principal principal
    ) {
        return ResponseEntity.ok(
                usuarioService.obtenerPerfil(
                        principal.getName()
                )
        );
    }
    
@PutMapping(value = "/perfil", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<?> actualizarPerfil(
        Principal principal,
        @ModelAttribute ProfileUpdateRequest req,
        @RequestParam(value = "foto", required = false) MultipartFile foto,
        @RequestParam(value = "fotoUrl", required = false) String fotoUrl
) {

    usuarioService.actualizarPerfil(
            principal.getName(),
            req,
            foto,
            fotoUrl
    );

    return ResponseEntity.ok().build();
}
        
}