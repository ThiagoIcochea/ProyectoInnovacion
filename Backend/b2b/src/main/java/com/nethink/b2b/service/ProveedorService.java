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
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nethink.b2b.dto.response.AdminProviderResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;

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
    
    @Autowired
private LogsSistemaService logsSistemaService;
    
    @Autowired
private LogsApiRepository logsApiRepository;

    @Transactional
    public void registerProvider(RegisterProviderRequest req,  HttpServletRequest request) {

        if (usuarioRepository.findByCorreo(req.getCorreo()).isPresent()) {
            logsSistemaService.registrarLog(
    null,
    "CORREO_DUPLICADO",
    "PROVEEDORES",
    "Intento registro proveedor con correo existente: "
        + req.getCorreo(),
    request
);
            throw new RuntimeException("Correo ya registrado");
        }

        if (proveedorRepository.findByRuc(req.getRuc()).isPresent()) {
            
            logsSistemaService.registrarLog(
    null,
    "RUC_DUPLICADO",
    "PROVEEDORES",
    "Intento registro con RUC existente: "
        + req.getRuc(),
    request
);
            
            throw new RuntimeException("RUC ya registrado");
        }

        SunatResponse sunat = sunatService.consultarRuc(req.getRuc());

        if (sunat == null || sunat.getRazonSocial() == null) {
            logsSistemaService.registrarLog(
    null,
    "SUNAT_ERROR",
    "SUNAT",
    "RUC inválido consultado: "
        + req.getRuc(),
   request
);
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

        user = usuarioRepository.save(user);
        
        logsSistemaService.registrarLog(
    user.getIdUsuario(),
    "USUARIO_PROVEEDOR_CREADO",
    "PROVEEDORES",
    "Usuario proveedor registrado: "
        + user.getCorreo(),
   request
);

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

       prov = proveedorRepository.save(prov);
       
       logsSistemaService.registrarLog(
    user.getIdUsuario(),
    "PROVEEDOR_REGISTRADO",
    "PROVEEDORES",
    "Proveedor registrado: "
        + prov.getRazonSocial()
        + " | RUC: "
        + prov.getRuc(),
    request
);

        if (req.getMetodosPago() != null) {
            for (MetodoPagoRequest mp : req.getMetodosPago()) {

                MetodoPago metodo = new MetodoPago();
                metodo.setIdProveedor(prov.getIdProveedor());
                metodo.setTipo(mp.getTipo());
                metodo.setEntidad(mp.getEntidad());
                metodo.setNumeroCuenta(mp.getNumeroCuenta());

                metodoPagoRepository.save(metodo);
                
                logsSistemaService.registrarLog(
    user.getIdUsuario(),
    "METODO_PAGO_REGISTRADO",
    "PROVEEDORES",
    "Método pago agregado proveedor: "
        + prov.getRazonSocial(),
   request
);
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
                
                logsSistemaService.registrarLog(
    user.getIdUsuario(),
    "CERTIFICACION_REGISTRADA",
    "PROVEEDORES",
    "Certificación agregada: "
        + cert.getNombre(),
    request
);
            }
        }

        emailService.enviarCorreoRegistroProveedor(
                user,
                prov.getRazonSocial(),
                prov.getRuc()
        );
        
        logsSistemaService.registrarLog(
    user.getIdUsuario(),
    "EMAIL_REGISTRO",
    "EMAIL",
    "Correo registro proveedor enviado",
    request
);
    }
    
   public List<AdminProviderResponse> listarProviders(Integer idUsuario,  HttpServletRequest request) {

       logsSistemaService.registrarLog(
    idUsuario,
    "LISTAR_PROVEEDORES",
    "ADMIN",
    "Consulta global proveedores",
    request
);
    List<Proveedor> providers =
            proveedorRepository.findAll();

    List<AdminProviderResponse> response =
            new ArrayList<>();

    for (Proveedor p : providers) {

        AdminProviderResponse dto =
                new AdminProviderResponse();

        dto.setIdProveedor(
                p.getIdProveedor());

        dto.setRazonSocial(
                p.getRazonSocial());

        dto.setRuc(
                p.getRuc());

        dto.setApiUrl(
                p.getApiUrl());

        dto.setApiTipo(
                p.getApiTipo());

        dto.setEstado(
                p.getEstado());

        if (p.getUsuario() != null) {

            dto.setCorreo(
                    p.getUsuario()
                     .getCorreo());
        }

        dto.setEstadoApi(p.getEstadoApi());

        response.add(dto);
    }

    return response;
}
}