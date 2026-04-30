package com.nethink.b2b.controller;

import com.nethink.b2b.entity.Configuracion;
import com.nethink.b2b.service.ConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/config")
public class ConfiguracionController {

    @Autowired
    private ConfigService service;

    @PutMapping
    public void update(@RequestBody Configuracion config) {
        service.actualizar(config.getClave(), config.getValor());
    }

    @GetMapping("/{clave}")
    public String get(@PathVariable String clave) {
        return service.getValor(clave);
    }
}