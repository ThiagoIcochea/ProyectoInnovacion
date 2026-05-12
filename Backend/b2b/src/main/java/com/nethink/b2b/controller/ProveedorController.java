package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.RegisterProviderRequest;
import com.nethink.b2b.service.ProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/provider")
public class ProveedorController {

    @Autowired
    private ProveedorService proveedorService;

    @PostMapping("/register")
    public String register(@RequestBody RegisterProviderRequest req) {
        proveedorService.registerProvider(req);
        return "Proveedor registrado correctamente";
    }
}