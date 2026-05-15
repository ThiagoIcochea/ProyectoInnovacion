package com.nethink.b2b.controller;

import com.nethink.b2b.dto.response.ProveedorProductoResponse;
import com.nethink.b2b.service.ProveedorProductoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proveedor-productos")
public class ProveedorProductoController {

    private final ProveedorProductoService service;

    public ProveedorProductoController(ProveedorProductoService service) {
        this.service = service;
    }

    @GetMapping("/{idProveedor}")
    public List<ProveedorProductoResponse> listar(@PathVariable Integer idProveedor) {
        return service.listarProductosPorProveedor(idProveedor);
    }
}