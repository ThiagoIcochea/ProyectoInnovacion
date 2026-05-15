package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.ConfiguracionUpdateRequest;
import com.nethink.b2b.dto.response.ConfiguracionResponse;
import com.nethink.b2b.entity.Configuracion;
import com.nethink.b2b.service.ConfigService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/config")
@CrossOrigin("*")
public class ConfiguracionController {

    @Autowired
    private ConfigService service;

    // =========================
    // LISTAR CONFIGURACIONES
    // =========================
    @GetMapping
    public ResponseEntity<List<ConfiguracionResponse>> listar() {

        return ResponseEntity.ok(
                service.listar()
        );
    }

    // =========================
    // OBTENER POR CLAVE
    // =========================
    @GetMapping("/{clave}")
    public String get(@PathVariable String clave) {

        return service.getValor(clave);
    }

   
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(
            @PathVariable Integer id,
            @RequestBody ConfiguracionUpdateRequest req
    ) {

        service.actualizarValor(
                id,
                req.getValor()
        );

        return ResponseEntity.ok().build();
    }

    
    @PostMapping("/{id}/test")
    public ResponseEntity<String> probar(
            @PathVariable Integer id
    ) {

        return ResponseEntity.ok(
                service.probarConexion(id)
        );
    }

   
    @PutMapping
    public void update(
            @RequestBody Configuracion config
    ) {

        service.actualizar(
                config.getClave(),
                config.getValor()
        );
    }
}