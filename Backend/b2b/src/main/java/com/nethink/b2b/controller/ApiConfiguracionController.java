package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.ApiConfiguracionRequest;
import com.nethink.b2b.dto.response.ApiConfiguracionResponse;
import com.nethink.b2b.service.ApiConfiguracionService;
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
            @RequestParam String correo
    ) {
        return service.obtenerConfiguracion(correo);
    }

    @PutMapping
    public void actualizar(
            @RequestParam String correo,
            @RequestBody ApiConfiguracionRequest request
    ) {
        service.actualizarConfiguracion(correo, request);
    }

    @PostMapping("/probar")
    public ApiConfiguracionResponse probar(
            @RequestParam String correo
    ) {
        return service.probarConexion(correo);
    }
}