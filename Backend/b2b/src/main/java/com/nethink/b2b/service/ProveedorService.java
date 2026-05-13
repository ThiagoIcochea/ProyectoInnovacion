package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.RegisterProviderRequest;
import com.nethink.b2b.dto.response.SunatResponse;
import com.nethink.b2b.entity.*;
import com.nethink.b2b.entity.enums.EstadoUsuario;
import com.nethink.b2b.repository.ProveedorRepository;
import com.nethink.b2b.repository.RolRepository;
import com.nethink.b2b.repository.UsuarioRepository;
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
        
        emailService.enviarCorreoRegistroProveedor(user, prov.getRazonSocial(), prov.getRuc());
    }
}