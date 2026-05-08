package com.nethink.b2b.service;

import com.nethink.b2b.entity.Solicitud;

public interface EmailService {

    void enviarCorreoCliente(Solicitud solicitud);

    void enviarCorreoProveedor(Solicitud solicitud);
}