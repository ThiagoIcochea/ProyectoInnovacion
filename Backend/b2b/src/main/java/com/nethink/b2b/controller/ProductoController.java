package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.FiltroRFQRequest; 
import com.nethink.b2b.dto.response.CatalogoFiltrosResponse;
import com.nethink.b2b.entity.Producto;
import com.nethink.b2b.service.ProductoService;
import com.nethink.b2b.dto.response.CatalogoResponse;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoService productoService;
   

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
        
    }

    @GetMapping
    public List<Producto> listar(@RequestParam(required = false) String search) {
        return productoService.listarProductos(search);
    }

 

    @GetMapping("/filtros")
    public ResponseEntity<CatalogoFiltrosResponse> obtenerFiltros() {
        return ResponseEntity.ok(productoService.obtenerFiltrosCatalogo());
    }

    
    @PostMapping("/catalogo/filtrado")
    public ResponseEntity<List<CatalogoResponse>> filtrarCatalogo(@RequestBody FiltroRFQRequest filtro) {
        return ResponseEntity.ok(productoService.filtrarCatalogo(filtro));
    }
}
