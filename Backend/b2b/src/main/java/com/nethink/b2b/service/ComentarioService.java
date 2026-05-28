package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.CrearComentarioRequest;
import com.nethink.b2b.dto.request.ReaccionComentarioRequest;
import com.nethink.b2b.dto.response.IAComentarioResponse;
import com.nethink.b2b.entity.Comentario;
import com.nethink.b2b.entity.ComentarioLike;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.repository.ComentarioLikeRepository;
import com.nethink.b2b.repository.ComentarioRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class ComentarioService {

    private final ComentarioRepository comentarioRepository;
    private final ComentarioLikeRepository likeRepository;
    private final ModeracionService moderacionService;
    
         @Autowired
     
     private ProveedorProductoRepository proveedorProductoRepo;

    public ComentarioService(
            ComentarioRepository comentarioRepository,
            ComentarioLikeRepository likeRepository,
            ModeracionService moderacionService
    ) {
        this.comentarioRepository = comentarioRepository;
        this.likeRepository = likeRepository;
        this.moderacionService = moderacionService;
    }

    public Comentario crearComentario(
            CrearComentarioRequest request,
            Integer idUsuario
    ) {

         ProveedorProducto provProd = proveedorProductoRepo.findByProveedor_IdProveedorAndProducto_IdProducto(request.getIdProv(), request.getIdProd()).orElseThrow();
        IAComentarioResponse ia =
                moderacionService.moderar(
                        request.getComentario()
                );

        if (!"OK".equalsIgnoreCase(
                ia.getEstado()
        )) {

            throw new RuntimeException(
                    "Comentario inapropiado"
            );
        }

        Comentario comentario =
                new Comentario();

        comentario.setIdProvProd(
              provProd.getIdProvProd()
        );

        comentario.setIdUsuario(idUsuario
               
        );

        comentario.setComentario(
                request.getComentario()
        );

        comentario.setFecha(
                LocalDateTime.now()
        );

        /*
          SENTIMIENTO:
          POSITIVO
          NEGATIVO
          NEUTRO
        */
        comentario.setTipo(
                ia.getSentimiento()
        );

        /*
          CACHE INICIAL
        */
        comentario.setLikes(0);
        comentario.setDislikes(0);

        return comentarioRepository.save(
                comentario
        );
    }

    public List<Comentario> listar(
            Integer idProvProd
    ) {

        return comentarioRepository
                .findByIdProvProdOrderByFechaDesc(
                        idProvProd
                );
    }

    public void reaccionar(
            ReaccionComentarioRequest request,
            Integer idUsuario
    ) {

        Comentario comentario =
                comentarioRepository
                        .findById(
                                request.getIdComentario()
                        )
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Comentario no encontrado"
                                )
                        );

        /*
          VALIDAR SOLO:
          LIKE / DISLIKE
        */
        if (
                !"LIKE".equalsIgnoreCase(
                        request.getTipo()
                )
                &&
                !"DISLIKE".equalsIgnoreCase(
                        request.getTipo()
                )
        ) {

            throw new RuntimeException(
                    "Tipo de reaccion invalido"
            );
        }

        ComentarioLike reaccionExistente =
                likeRepository
                        .findByIdComentarioAndIdUsuario(
                                request.getIdComentario(),
                                idUsuario
                        )
                        .orElse(null);

        /*
          UPDATE
        */
        if (reaccionExistente != null) {

            reaccionExistente.setTipo(
                    request.getTipo()
                            .toUpperCase()
            );

            likeRepository.save(
                    reaccionExistente
            );

        } else {

            /*
              INSERT
            */
            ComentarioLike like =
                    new ComentarioLike();

            like.setIdComentario(
                    request.getIdComentario()
            );

            like.setIdUsuario(idUsuario
                    
            );

            like.setTipo(
                    request.getTipo()
                            .toUpperCase()
            );

            likeRepository.save(
                    like
            );
        }

        /*
          RECALCULAR CACHE
        */
        int likes =
                likeRepository
                        .countByIdComentarioAndTipo(
                                comentario.getIdComentario(),
                                "LIKE"
                        );

        int dislikes =
                likeRepository
                        .countByIdComentarioAndTipo(
                                comentario.getIdComentario(),
                                "DISLIKE"
                        );

        comentario.setLikes(
                likes
        );

        comentario.setDislikes(
                dislikes
        );

        comentarioRepository.save(
                comentario
        );
    }
}