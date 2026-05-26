package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.ProfileUpdateRequest;
import com.nethink.b2b.dto.request.RegisterClientRequest;
import com.nethink.b2b.dto.response.ProfileResponse;
import com.nethink.b2b.service.UsuarioService;
import java.security.Principal;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.nethink.b2b.dto.response.AdminUserResponse;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
     private final UsuarioRepository usuarioRepo;

    public UsuarioController(UsuarioService usuarioService,  UsuarioRepository usuarioRepo) {
        this.usuarioService = usuarioService;
        this.usuarioRepo = usuarioRepo;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterClientRequest request, HttpServletRequest httpRequest
    ) {

        usuarioService.registrarCliente(request,httpRequest);

        return ResponseEntity.ok("Cliente registrado correctamente");
    }

    @GetMapping("/perfil")
    public ResponseEntity<ProfileResponse> perfil(
            Principal principal, HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(
                usuarioService.obtenerPerfil(
                        principal.getName(), httpRequest
                )
        );
    }

    @PutMapping(value = "/perfil", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> actualizarPerfil(
            Principal principal,
            @ModelAttribute ProfileUpdateRequest req,
            @RequestParam(value = "foto", required = false) MultipartFile foto,
            @RequestParam(value = "fotoUrl", required = false) String fotoUrl,
            HttpServletRequest httpRequest
    ) {

        usuarioService.actualizarPerfil(
                principal.getName(),
                req,
                foto,
                fotoUrl,
                httpRequest
        );

        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/admin/listar")
public ResponseEntity<List<AdminUserResponse>>
listarUsuarios(Principal principal, HttpServletRequest httpRequest) {
 Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    return ResponseEntity.ok(
            usuarioService.listarUsuarios(usuario.getIdUsuario(),httpRequest)
    );
}
}