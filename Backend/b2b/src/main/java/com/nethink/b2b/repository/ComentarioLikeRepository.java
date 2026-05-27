/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.repository;

import com.nethink.b2b.entity.ComentarioLike;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComentarioLikeRepository extends JpaRepository<ComentarioLike, Integer> {

    int countByIdComentarioAndTipo(Integer idComentario, String tipo);

    boolean existsByIdComentarioAndIdUsuario(Integer idComentario, Integer idUsuario);
}
