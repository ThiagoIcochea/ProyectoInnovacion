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
import com.nethink.b2b.dto.response.IndicadorProveedorResponse;
import com.nethink.b2b.entity.Solicitud.EstadoSolicitud;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Comparator;
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
    private ScoringService scoringService;

    @Autowired
    private MetodoPagoRepository metodoPagoRepository;
    
    @Autowired
    private ComentarioRepository comentarioRepository;

    @Autowired
    private CertificacionRepository certificacionRepository;

    @Autowired
    private ProveedorCertificacionRepository proveedorCertificacionRepository;
    
    @Autowired
    
    private SolicitudRepository solicitudRepo;
    
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
   
   
   public IndicadorProveedorResponse obtenerIndicadoresPorProveedor(Integer idProveedor) {

    Proveedor proveedor = proveedorRepository.findById(idProveedor)
            .orElseThrow(() -> new RuntimeException("Proveedor no existe"));

    int completadas = solicitudRepo
            .countByProveedor_IdProveedorAndEstado(idProveedor, EstadoSolicitud.ENTREGADA)+ solicitudRepo
            .countByProveedor_IdProveedorAndEstado(idProveedor, EstadoSolicitud.COMPLETADA);

    int total = solicitudRepo
            .countByProveedor_IdProveedor(idProveedor);

    double cumplimiento = total == 0
            ? 0
            : ((double) solicitudRepo.contarEntregasATiempo(idProveedor)/ completadas) * 100;

    double scoreCalidad = scoringService.calcularScoreProveedorBasico(idProveedor);
    
    
    double satisfaccion  = solicitudRepo.calcularSatisfaccionProveedor(idProveedor);
    
    double tiempoEntregaPromedio = solicitudRepo.calcularTiempoEntregaPromedio(idProveedor);

    IndicadorProveedorResponse dto = new IndicadorProveedorResponse();

    dto.setIdProveedor(idProveedor);
    dto.setRazonSocial(proveedor.getRazonSocial());

    dto.setPedidosCompletados(completadas);
    dto.setPedidosTotal(total);

    dto.setCumplimiento(cumplimiento);

   
    dto.setScoreGeneral(scoreCalidad);
    
    dto.setSatisfaccion(satisfaccion);
    
   
    dto.setTiempoEntregaPromedio(tiempoEntregaPromedio);
    
    dto.setFechaRegistro(proveedor.getFechaRegistro());

    return dto;
}
   
public List<IndicadorProveedorResponse> top10Proveedores() {

    List<Proveedor> proveedores = proveedorRepository.findAll();

    List<IndicadorProveedorResponse> lista = new ArrayList<>();

    for (Proveedor p : proveedores) {

        int completadas = solicitudRepo
                .countByProveedor_IdProveedorAndEstado(
                        p.getIdProveedor(),
                        EstadoSolicitud.COMPLETADA
                );

        int total = solicitudRepo
                .countByProveedor_IdProveedor(
                        p.getIdProveedor()
                );

        if (total == 0) {
            continue;
        }

        double cumplimiento =
                ((double) completadas / total) * 100.0;

        double score = scoringService
                .calcularScoreProveedorCompleto(
                        p.getIdProveedor()
                );

        int likes = 0;
        int dislikes = 0;
        int totalResenas = 0;

        double tiempoEntregaPromedio = 0;

        try {

            List<Comentario> comentarios =
                    comentarioRepository
                            .findByProveedor_IdProveedor(
                                    p.getIdProveedor()
                            );

            totalResenas = comentarios.size();

            likes = comentarios.stream()
                    .mapToInt(c ->
                            c.getLikes() != null
                                    ? c.getLikes()
                                    : 0
                    )
                    .sum();

            dislikes = comentarios.stream()
                    .mapToInt(c ->
                            c.getDislikes() != null
                                    ? c.getDislikes()
                                    : 0
                    )
                    .sum();

        } catch (Exception e) {

            likes = 0;
            dislikes = 0;
            totalResenas = 0;
        }

        int totalFeedback = likes + dislikes;

        int satisfaccion = totalFeedback == 0
                ? 0
                : (likes * 100) / totalFeedback;

        IndicadorProveedorResponse dto =
                new IndicadorProveedorResponse();

        dto.setIdProveedor(
                p.getIdProveedor()
        );

        dto.setRazonSocial(
                p.getRazonSocial()
        );

        dto.setPedidosCompletados(
                completadas
        );

        dto.setPedidosTotal(
                total
        );

        dto.setCumplimiento(
                Math.round(cumplimiento * 100.0) / 100.0
        );

        dto.setScoreGeneral(
                Math.round(score * 1000.0) / 1000.0
        );

        dto.setLikes(
                likes
        );

        dto.setDislikes(
                dislikes
        );

        dto.setTotalResenas(
                totalResenas
        );

        dto.setSatisfaccion(
                satisfaccion
        );

        dto.setTiempoEntregaPromedio(
                tiempoEntregaPromedio
        );

        dto.setEstado(
                p.getEstado()
        );

        dto.setVerificado(
                "ACTIVO".equalsIgnoreCase(
                        p.getEstado()
                )
        );

        dto.setCategoriaPrincipal(
                "Proveedor B2B"
        );

        lista.add(dto);
    }

    return lista.stream()
            .sorted(
                    Comparator.comparingDouble(
                            IndicadorProveedorResponse::getScoreGeneral
                    ).reversed()
            )
            .limit(10)
            .toList();
}
}