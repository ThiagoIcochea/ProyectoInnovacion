package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.FiltroRFQRequest;
import com.nethink.b2b.dto.response.CatalogoFiltrosResponse;
import com.nethink.b2b.dto.response.CatalogoResponse;
import com.nethink.b2b.dto.response.EspecificacionResponse;
import com.nethink.b2b.dto.response.FiltroItemDTO;
import com.nethink.b2b.entity.Producto;
import com.nethink.b2b.entity.ProductoEspecificacion;
import com.nethink.b2b.repository.ProductoRepository;
import com.nethink.b2b.repository.CategoriaRepository;
import com.nethink.b2b.repository.MarcaRepository;
import com.nethink.b2b.repository.ProductoEspecificacionRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final MarcaRepository marcaRepository;
    private final ProductoEspecificacionRepository especificacionesRepository;
    private final CatalogoService catalogoService;

    public ProductoService(ProductoRepository productoRepository, 
                           CategoriaRepository categoriaRepository, 
                           MarcaRepository marcaRepository,
                           ProductoEspecificacionRepository especificacionesRepository,
                           CatalogoService catalogoService) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
        this.marcaRepository = marcaRepository;
        this.especificacionesRepository = especificacionesRepository;
        this.catalogoService = catalogoService;
    }

    public List<Producto> listarProductos(String filtro) {
        if (filtro != null && !filtro.isEmpty()) {
            return productoRepository.findByNombreContainingIgnoreCase(filtro);
        }
        return productoRepository.findAll();
    }

    public CatalogoFiltrosResponse obtenerFiltrosCatalogo() {
        List<FiltroItemDTO> categorias = categoriaRepository.obtenerFiltrosConConteo();
        List<FiltroItemDTO> marcas = marcaRepository.obtenerFiltrosConConteo();
        return new CatalogoFiltrosResponse(categorias, marcas);
    }

   
    public List<CatalogoResponse> filtrarCatalogo(FiltroRFQRequest filtro) {
    // 1. Si no hay filtros, retornar todo el catálogo
    if ((filtro.getCategorias() == null || filtro.getCategorias().isEmpty()) && 
        (filtro.getMarcas() == null || filtro.getMarcas().isEmpty()) &&
        (filtro.getEspecificaciones() == null || filtro.getEspecificaciones().isEmpty())) {
        return catalogoService.listarCatalogo(); 
    }

    // 2. Obtener productos por Categoría/Marca
    List<Producto> productos = productoRepository.buscarConFiltros(
        filtro.getCategorias(), 
        filtro.getMarcas()
    );

    if (productos.isEmpty()) return new ArrayList<>();

    // 3. Unir con especificaciones en memoria
    List<Integer> ids = productos.stream().map(Producto::getIdProducto).collect(Collectors.toList());
    List<ProductoEspecificacion> todasLasSpecs = especificacionesRepository.findByProducto_IdProductoIn(ids);
    Map<Integer, List<ProductoEspecificacion>> specsMap = todasLasSpecs.stream()
        .collect(Collectors.groupingBy(s -> s.getProducto().getIdProducto()));

    return productos.stream()
        .map(p -> {
            CatalogoResponse dto = mapToCatalogoResponse(p);
            List<ProductoEspecificacion> pSpecs = specsMap.getOrDefault(p.getIdProducto(), new ArrayList<>());
            dto.setEspecificaciones(pSpecs.stream()
                .map(s -> new EspecificacionResponse(s.getNombre(), s.getValor()))
                .collect(Collectors.toList()));
            return dto;
        })
        // 4. FILTRO DE SIMILITUD CORREGIDO (anyMatch)
        .filter(dto -> {
            if (filtro.getEspecificaciones() == null || filtro.getEspecificaciones().isEmpty()) return true;
            
            // Verifica que todas las palabras buscadas existan en alguna especificación
            return filtro.getEspecificaciones().stream().allMatch(busqueda -> 
                dto.getEspecificaciones().stream().anyMatch(s -> 
                    (s.getNombre() + " " + s.getValor()).toLowerCase().contains(busqueda.toLowerCase())
                )
            );
        })
        .collect(Collectors.toList());
}



    private CatalogoResponse mapToCatalogoResponse(Producto p) {
        CatalogoResponse resp = new CatalogoResponse();
        resp.setIdProducto(p.getIdProducto());
        resp.setProducto(p.getNombre());
        resp.setMarca(p.getMarca() != null ? p.getMarca().getNombre() : "Genérico");
        resp.setCategoria(p.getCategoria() != null ? p.getCategoria().getNombre() : "Sin categoría");
        resp.setDescripcion(p.getDescripcion());
        resp.setEspecificaciones(new ArrayList<>());
        return resp;
    }
}
