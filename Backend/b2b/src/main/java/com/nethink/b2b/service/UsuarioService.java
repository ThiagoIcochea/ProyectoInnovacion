package com.nethink.b2b.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.nethink.b2b.dto.request.ProfileUpdateRequest;
import com.nethink.b2b.dto.request.RegisterClientRequest;
import com.nethink.b2b.dto.response.ProfileResponse;
import com.nethink.b2b.entity.PreferenciaUsuario;
import com.nethink.b2b.entity.Rol;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.entity.enums.EstadoUsuario;
import com.nethink.b2b.repository.PreferenciaUsuarioRepository;
import com.nethink.b2b.repository.RolRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.nethink.b2b.dto.response.AdminUserResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.util.ArrayList;
import java.util.List;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepo;
    private final PreferenciaUsuarioRepository prefRepo;
    private final Cloudinary cloudinary;
    private final RolRepository rolRepository;
    private final EmailService emailService;
    private final LogsSistemaService logsSistemaService;

    public UsuarioService(
            UsuarioRepository usuarioRepo,
            PreferenciaUsuarioRepository prefRepo,
            Cloudinary cloudinary,
            RolRepository rolRepository,
            EmailService emailService,
            LogsSistemaService logsSistemaService
    ) {
        this.usuarioRepo = usuarioRepo;
        this.prefRepo = prefRepo;
        this.cloudinary = cloudinary;
        this.rolRepository = rolRepository;
        this.emailService=emailService;
        this.logsSistemaService = logsSistemaService;
    }

    public void registrarCliente(RegisterClientRequest req,  HttpServletRequest request) {

        if (usuarioRepo.findByCorreo(req.getCorreo()).isPresent()) {
            throw new RuntimeException("Correo ya registrado");
        }

        Rol rol = rolRepository.findById(2)
                .orElseThrow(() -> new RuntimeException("Rol CLIENTE no encontrado"));

        Usuario usuario = new Usuario();

        usuario.setNombres(req.getNombres());
        usuario.setApellidos(req.getApellidos());
        usuario.setCorreo(req.getCorreo());
        usuario.setTelefono(req.getTelefono());
        usuario.setWhatsapp(req.getWhatsapp());
        usuario.setPassword(req.getPassword());
        usuario.setDireccion(req.getDireccion());
        usuario.setFotoPerfil(req.getFotoPerfil());

        usuario.setRol(rol);

        usuario.setEstado(EstadoUsuario.ACTIVO);

        usuario.setFechaRegistro(LocalDateTime.now());
        

        usuario = usuarioRepo.save(usuario);
        
        logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "REGISTRO_USUARIO",
    "USUARIOS",
    "Nuevo cliente registrado: "
        + usuario.getCorreo(),
     request
);
        
        emailService.enviarCorreoRegistroCliente(usuario);
    }

    public ProfileResponse obtenerPerfil(String correo,  HttpServletRequest request) {

        Usuario usuario = usuarioRepo.findByCorreo(correo)
                .orElseThrow();
        
        logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "VER_PERFIL",
    "USUARIOS",
    "Consulta perfil usuario",
    request
);

        PreferenciaUsuario pref = prefRepo
                .findByUsuario_IdUsuario(usuario.getIdUsuario())
                .orElseGet(() -> {
                    PreferenciaUsuario nueva = new PreferenciaUsuario();
                    nueva.setUsuario(usuario);
                    nueva.setFechaActualizacion(LocalDateTime.now());
                    return prefRepo.save(nueva);
                });

        ProfileResponse r = new ProfileResponse();

        r.setIdUsuario(usuario.getIdUsuario());
        r.setNombres(usuario.getNombres());
        r.setApellidos(usuario.getApellidos());
        r.setCorreo(usuario.getCorreo());
        r.setTelefono(usuario.getTelefono());
        r.setWhatsapp(usuario.getWhatsapp());
        r.setDireccion(usuario.getDireccion());
        r.setFotoPerfil(usuario.getFotoPerfil());
        r.setRol(usuario.getRol().getNombre());

        r.setNotificacionesRfq(pref.getNotificacionesRfq());
        r.setEntregaRapida(pref.getEntregaRapida());

        return r;
    }

    public void actualizarPerfil(
            String correo,
            ProfileUpdateRequest req,
            MultipartFile foto,
            String fotoUrl,
             HttpServletRequest request
    ) {

        Usuario usuario = usuarioRepo.findByCorreo(correo)
                .orElseThrow();

        usuario.setNombres(req.getNombres());
        usuario.setApellidos(req.getApellidos());
        usuario.setTelefono(req.getTelefono());
        usuario.setWhatsapp(req.getWhatsapp());
        usuario.setDireccion(req.getDireccion());
        if (!usuario.getCorreo().equals(req.getCorreo())) {

    boolean existe = usuarioRepo.findByCorreo(req.getCorreo()).isPresent();

    if (existe) {
        
        logsSistemaService.registrarLog(
    null,
    "CORREO_DUPLICADO",
    "USUARIOS",
    "Intento registro con correo existente: "
        + req.getCorreo(),
  request
);
        logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "ERROR_CORREO_DUPLICADO",
    "USUARIOS",
    "Intento actualizar a correo existente: "
        + req.getCorreo(),
    request
);
        throw new RuntimeException("El correo ya está registrado por otro usuario");
    }

    usuario.setCorreo(req.getCorreo());
    logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "CAMBIO_CORREO",
    "USUARIOS",
    "Correo actualizado a: "
        + req.getCorreo(),
    request
);
    }

        if (foto != null && !foto.isEmpty()) {
            try {
                usuario.setFotoPerfil(subirACloudinary(usuario.getIdUsuario(),foto,request));
            } catch (IOException e) {
                logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "CLOUDINARY_ERROR",
    "USUARIOS",
    e.getMessage(),
    request
);
                throw new RuntimeException("Error subiendo archivo a Cloudinary", e);
            }
        } else if (fotoUrl != null && !fotoUrl.isEmpty()) {
            usuario.setFotoPerfil(fotoUrl);
        }

        usuarioRepo.save(usuario);
        
        logsSistemaService.registrarLog(
    usuario.getIdUsuario(),
    "ACTUALIZAR_PERFIL",
    "USUARIOS",
    "Perfil actualizado",
    request
);

        PreferenciaUsuario pref = prefRepo
                .findByUsuario_IdUsuario(usuario.getIdUsuario())
                .orElse(new PreferenciaUsuario());

        pref.setUsuario(usuario);
        pref.setNotificacionesRfq(req.isNotificaciones());
        pref.setEntregaRapida(req.isEntregaRapida());
        pref.setFechaActualizacion(LocalDateTime.now());

        prefRepo.save(pref);
    }

    private String subirACloudinary( Integer idUsuario,MultipartFile archivo,  HttpServletRequest request) throws IOException {

        Map uploadResult = cloudinary.uploader().upload(
                archivo.getBytes(),
                ObjectUtils.asMap(
                        "folder", "b2b/perfil"
                )
        );
        
        logsSistemaService.registrarLog(
    idUsuario,
    "UPLOAD_FOTO",
    "CLOUDINARY",
    "Foto perfil subida correctamente",
    request
);

        return uploadResult.get("secure_url").toString();
    }
    
    public List<AdminUserResponse> listarUsuarios(Integer idUsuario, HttpServletRequest request) {
    logsSistemaService.registrarLog(
    idUsuario,
    "LISTAR_USUARIOS",
    "ADMIN",
    "Consulta global usuarios",
    request
);
    List<Usuario> usuarios =
            usuarioRepo.findAll();

    List<AdminUserResponse> response =
            new ArrayList<>();

    for (Usuario u : usuarios) {

        AdminUserResponse dto =
                new AdminUserResponse();

        dto.setIdUsuario(
                u.getIdUsuario()
        );

        dto.setNombreCompleto(
                u.getNombres()
                + " "
                + u.getApellidos()
        );

        dto.setCorreo(
                u.getCorreo()
        );

        dto.setRol(
                u.getRol().getNombre()
        );

        dto.setEstado(
                u.getEstado().name()
        );

        dto.setFechaRegistro(
                u.getFechaRegistro()
        );

        dto.setFotoPerfil(
                u.getFotoPerfil()
        );

        response.add(dto);
    }

    return response;
}
}