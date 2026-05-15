package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.ApiConfiguracionRequest;
import com.nethink.b2b.dto.response.ApiConfiguracionResponse;
import com.nethink.b2b.service.ApiConfiguracionService;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/proveedor-api")
public class ApiConfiguracionController {

    private final ApiConfiguracionService service;

    public ApiConfiguracionController(
            ApiConfiguracionService service
    ) {
        this.service = service;
    }

    @GetMapping
    public ApiConfiguracionResponse obtener(
            Principal principal
    ) {
        return service.obtenerConfiguracion(principal.getName());
    }

    @PutMapping
    public void actualizar(
            Principal principal,
            @RequestBody ApiConfiguracionRequest request
    ) {
        service.actualizarConfiguracion(principal.getName(), request);
    }

    @PostMapping("/probar")
    public ApiConfiguracionResponse probar(
            Principal principal
    ) {
        return service.probarConexion(principal.getName());
    }
}