/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.controller;

import com.nethink.b2b.dto.response.IAComentarioResponse;
import com.nethink.b2b.entity.Comentario;
import com.nethink.b2b.service.ModeracionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/comentarios")
public class ComentarioController {

    private final ModeracionService moderacionService;

    public ComentarioController(ModeracionService moderacionService) {
        this.moderacionService = moderacionService;
    }

    @PostMapping("/validar")
    public ResponseEntity<?> validar(@RequestBody Comentario comentario) {

        IAComentarioResponse resp =
                moderacionService.moderar(comentario.getComentario());

        if (!"OK".equalsIgnoreCase(resp.getEstado())) {
            return ResponseEntity
                    .badRequest()
                    .body("Comentario inapropiado");
        }

        return ResponseEntity.ok(resp);
    }
}
