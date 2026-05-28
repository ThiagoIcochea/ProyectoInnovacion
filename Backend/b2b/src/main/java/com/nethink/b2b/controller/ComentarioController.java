package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.CrearComentarioRequest;
import com.nethink.b2b.dto.request.ReaccionComentarioRequest;
import com.nethink.b2b.entity.Comentario;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.UsuarioRepository;
import com.nethink.b2b.service.ComentarioService;
import java.security.Principal;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comentarios")
public class ComentarioController {

    private final ComentarioService comentarioService;
     @Autowired
    private  UsuarioRepository usuarioRepo;

    public ComentarioController(
            ComentarioService comentarioService
    ) {
        this.comentarioService = comentarioService;
    }

    @PostMapping
    public ResponseEntity<?> crear(
            @RequestBody CrearComentarioRequest request,
              Principal principal
    ) {
        
        Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return ResponseEntity.ok(
                comentarioService.crearComentario(
                        request, usuario.getIdUsuario()
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
            @RequestBody ReaccionComentarioRequest request,
              Principal principal
    ) {
       Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        comentarioService.reaccionar(
                request, usuario.getIdUsuario()
        );

        return ResponseEntity.ok().build();
    }
}