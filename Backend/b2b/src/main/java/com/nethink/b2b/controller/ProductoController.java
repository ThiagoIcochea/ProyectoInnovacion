package com.nethink.b2b.controller;

import com.nethink.b2b.entity.Producto;
import com.nethink.b2b.service.ProductoService;
import com.nethink.b2b.service.CatalogoService;
import com.nethink.b2b.dto.response.CatalogoResponse;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoService productoService;
    private final CatalogoService catalogoService;

    public ProductoController(ProductoService productoService,
                              CatalogoService catalogoService) {
        this.productoService = productoService;
        this.catalogoService = catalogoService;
    }

    @GetMapping
    public List<Producto> listar(@RequestParam(required = false) String search) {
        return productoService.listarProductos(search);
    }

    @GetMapping("/catalogo")
    public List<CatalogoResponse> catalogo() {
        return catalogoService.listarCatalogo();
    }
}