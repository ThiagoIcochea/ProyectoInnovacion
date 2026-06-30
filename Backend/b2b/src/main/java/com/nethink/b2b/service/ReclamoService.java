/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.ReclamoRequest;
import com.nethink.b2b.entity.Reclamo;
import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.entity.Solicitud.EstadoSolicitud;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.ReclamoRepository;
import com.nethink.b2b.repository.SolicitudRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
public class ReclamoService {

    private final ReclamoRepository reclamoRepository;
    private final SolicitudRepository solicitudRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;

    public ReclamoService(
            ReclamoRepository reclamoRepository,
            SolicitudRepository solicitudRepository,
            UsuarioRepository usuarioRepository,
            EmailService emailService) {

        this.reclamoRepository = reclamoRepository;
        this.solicitudRepository = solicitudRepository;
        this.usuarioRepository = usuarioRepository;
        this.emailService = emailService;
    }
    
    @Transactional
public void registrarReclamo(
        ReclamoRequest request,
        String correoUsuario
) {

    Usuario usuario = usuarioRepository
            .findByCorreo(correoUsuario)
            .orElseThrow();

    Solicitud solicitud = solicitudRepository
            .findById(request.getIdSolicitud())
            .orElseThrow();

    Reclamo reclamo = new Reclamo();

    reclamo.setIdSolicitud(
            solicitud.getIdSolicitud());

    reclamo.setIdUsuario(
            usuario.getIdUsuario());

    reclamo.setIdProveedor(
            solicitud.getProveedor().getIdProveedor());

    reclamo.setTipo(
            request.getTipo());

    reclamo.setDescripcion(
            request.getDescripcion());

    reclamo.setEstado("ABIERTO");

    reclamo.setFechaCreacion(
            LocalDateTime.now());

    reclamoRepository.save(reclamo);

    solicitud.setEstado(
            EstadoSolicitud.EN_RECLAMO);

    solicitudRepository.save(solicitud);

    emailService.enviarCorreoReclamoDemora(
            solicitud,
            request.getDescripcion(),
            ""
    );
}

}