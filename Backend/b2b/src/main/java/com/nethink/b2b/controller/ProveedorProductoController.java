package com.nethink.b2b.controller;

import com.nethink.b2b.dto.response.ProveedorProductoResponse;
import com.nethink.b2b.service.ProveedorProductoService;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proveedor-productos")
public class ProveedorProductoController {

    private final ProveedorProductoService service;

    public ProveedorProductoController(ProveedorProductoService service) {
        this.service = service;
    }

    @GetMapping("/mis-productos")
    public List<ProveedorProductoResponse> listar(
            Principal principal
    ) {
        return service.listarProductosPorProveedor(principal.getName());
    }
}