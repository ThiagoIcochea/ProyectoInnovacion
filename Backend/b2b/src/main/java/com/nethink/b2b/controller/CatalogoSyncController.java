package com.nethink.b2b.controller;

import com.nethink.b2b.dto.response.CatalogoResponse;
import com.nethink.b2b.service.SyncCatalogoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogo")
public class CatalogoSyncController {

    private final SyncCatalogoService syncService;

    public CatalogoSyncController(SyncCatalogoService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/sync")
    public String sincronizar(@RequestBody List<CatalogoResponse> data) {

        data.forEach(syncService::sync);

        return "Sincronización completada";
    }
}