package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.RegisterProviderRequest;
import com.nethink.b2b.dto.request.MetodoPagoRequest;
import com.nethink.b2b.dto.request.CertificacionRequest;
import com.nethink.b2b.dto.response.SunatResponse;
import com.nethink.b2b.entity.*;
import com.nethink.b2b.entity.enums.EstadoUsuario;
import com.nethink.b2b.repository.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProveedorService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProveedorRepository proveedorRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private SunatService sunatService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private MetodoPagoRepository metodoPagoRepository;

    @Autowired
    private CertificacionRepository certificacionRepository;

    @Autowired
    private ProveedorCertificacionRepository proveedorCertificacionRepository;

    @Transactional
    public void registerProvider(RegisterProviderRequest req) {

        if (usuarioRepository.findByCorreo(req.getCorreo()).isPresent()) {
            throw new RuntimeException("Correo ya registrado");
        }

        if (proveedorRepository.findByRuc(req.getRuc()).isPresent()) {
            throw new RuntimeException("RUC ya registrado");
        }

        SunatResponse sunat = sunatService.consultarRuc(req.getRuc());

        if (sunat == null || sunat.getRazonSocial() == null) {
            throw new RuntimeException("RUC inválido en SUNAT");
        }

        Rol rolProveedor = rolRepository.findById(3)
                .orElseThrow(() -> new RuntimeException("Rol proveedor no existe"));

        Usuario user = new Usuario();
        user.setNombres(req.getNombres());
        user.setApellidos(req.getApellidos());
        user.setCorreo(req.getCorreo());
        user.setTelefono(req.getTelefono());
        user.setWhatsapp(req.getWhatsapp());
        user.setPassword(req.getPassword());
        user.setDireccion(req.getDireccion());
        user.setEstado(EstadoUsuario.ACTIVO);
        user.setFechaRegistro(LocalDateTime.now());
        user.setRol(rolProveedor);

        usuarioRepository.save(user);

        Proveedor prov = new Proveedor();
        prov.setUsuario(user);
        prov.setRazonSocial(req.getRazonSocial());
        prov.setRuc(req.getRuc());
        prov.setDescripcion(req.getDescripcion());
        prov.setApiUrl(req.getApiUrl());
        prov.setApiTipo(req.getApiTipo());
        prov.setApiToken(req.getApiToken());
        prov.setFechaRegistro(LocalDateTime.now());
        prov.setEstado("ACTIVO");

        proveedorRepository.save(prov);

        if (req.getMetodosPago() != null) {
            for (MetodoPagoRequest mp : req.getMetodosPago()) {

                MetodoPago metodo = new MetodoPago();
                metodo.setIdProveedor(prov.getIdProveedor());
                metodo.setTipo(mp.getTipo());
                metodo.setEntidad(mp.getEntidad());
                metodo.setNumeroCuenta(mp.getNumeroCuenta());

                metodoPagoRepository.save(metodo);
            }
        }

        if (req.getCertificaciones() != null) {
            for (CertificacionRequest c : req.getCertificaciones()) {

                Certificacion cert = certificacionRepository.findById(c.getIdCertificacion())
                        .orElseThrow(() -> new RuntimeException("Certificación no existe"));

                ProveedorCertificacion pc = new ProveedorCertificacion();
                pc.setProveedor(prov);
                pc.setCertificacion(cert);
                pc.setFechaObtencion(c.getFechaObtencion());
                pc.setFechaExpiracion(c.getFechaExpiracion());

                proveedorCertificacionRepository.save(pc);
            }
        }

        emailService.enviarCorreoRegistroProveedor(
                user,
                prov.getRazonSocial(),
                prov.getRuc()
        );
    }
}