package com.nethink.b2b.service;

import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.entity.Usuario;

public interface EmailService {

    void enviarCorreoCliente(Solicitud solicitud);

    void enviarCorreoProveedor(Solicitud solicitud);
    void enviarCorreoEvaluacionCliente(Solicitud solicitud);
    void enviarCorreoReclamoDemora(Solicitud solicitud, String descripcion, String evidenciaJson);
    void enviarCorreoRegistroCliente(Usuario usuario);
    void enviarCorreoRegistroProveedor(
            Usuario usuario,
            String razonSocial,
            String ruc
    );
}