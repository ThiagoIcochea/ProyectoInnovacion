package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.CrearComentarioRequest;
import com.nethink.b2b.dto.request.ReaccionComentarioRequest;
import com.nethink.b2b.entity.Comentario;
import com.nethink.b2b.service.ComentarioService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comentarios")
public class ComentarioController {

    private final ComentarioService comentarioService;

    public ComentarioController(
            ComentarioService comentarioService
    ) {
        this.comentarioService = comentarioService;
    }

    @PostMapping
    public ResponseEntity<?> crear(
            @RequestBody CrearComentarioRequest request
    ) {

        return ResponseEntity.ok(
                comentarioService.crearComentario(
                        request
                )
        );
    }

    @GetMapping("/{idProvProd}")
    public ResponseEntity<List<Comentario>> listar(
            @PathVariable Integer idProvProd
    ) {

        return ResponseEntity.ok(
                comentarioService.listar(
                        idProvProd
                )
        );
    }

    @PostMapping("/reaccion")
    public ResponseEntity<?> reaccionar(
            @RequestBody ReaccionComentarioRequest request
    ) {

        comentarioService.reaccionar(
                request
        );

        return ResponseEntity.ok().build();
    }
}