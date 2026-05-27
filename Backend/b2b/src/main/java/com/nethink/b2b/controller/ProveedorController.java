package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.RegisterProviderRequest;
import com.nethink.b2b.dto.response.AdminProviderResponse;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.UsuarioRepository;
import com.nethink.b2b.service.ProveedorService;
import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/provider")
public class ProveedorController {

    @Autowired
    private ProveedorService proveedorService;
    @Autowired
    private  UsuarioRepository usuarioRepo;

   @PostMapping("/register")
public Map<String, String> register(@RequestBody RegisterProviderRequest req,  HttpServletRequest httpRequest) {
    proveedorService.registerProvider(req, httpRequest);
    return Map.of("message", "Proveedor registrado correctamente");
}

@GetMapping("/admin/listar")
public List<AdminProviderResponse> listarProviders(Principal principal, HttpServletRequest httpRequest ) {
    Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    return proveedorService.listarProviders( usuario.getIdUsuario(),  httpRequest);
}
}