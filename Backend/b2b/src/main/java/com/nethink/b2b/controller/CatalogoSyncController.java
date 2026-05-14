package com.nethink.b2b.controller;

import com.nethink.b2b.dto.response.CatalogoResponse;
import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.repository.ProveedorRepository;
import com.nethink.b2b.service.SyncCatalogoService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogo")
public class CatalogoSyncController {

    private final SyncCatalogoService syncService;
    private final ProveedorRepository proveedorRepo;

    public CatalogoSyncController(
            SyncCatalogoService syncService,
            ProveedorRepository proveedorRepo
    ) {

        this.syncService = syncService;
        this.proveedorRepo = proveedorRepo;
    }

    @PostMapping("/sync/{idProveedor}")
    public String sincronizar(
            @PathVariable Integer idProveedor,
            @RequestBody List<CatalogoResponse> data
    ) {

        Proveedor proveedor =
                proveedorRepo.findById(idProveedor)
                        .orElseThrow();

        for (CatalogoResponse dto : data) {

            syncService.sync(dto, proveedor);
        }

        return "Sincronización completada";
    }
}