package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.RegisterProviderRequest;
import com.nethink.b2b.service.ProveedorService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/provider")
public class ProveedorController {

    @Autowired
    private ProveedorService proveedorService;

   @PostMapping("/register")
public Map<String, String> register(@RequestBody RegisterProviderRequest req) {
    proveedorService.registerProvider(req);
    return Map.of("message", "Proveedor registrado correctamente");
}
}