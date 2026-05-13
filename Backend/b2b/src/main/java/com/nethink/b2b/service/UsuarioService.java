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

    public UsuarioService(
            UsuarioRepository usuarioRepo,
            PreferenciaUsuarioRepository prefRepo,
            Cloudinary cloudinary,
            RolRepository rolRepository,
            EmailService emailService
    ) {
        this.usuarioRepo = usuarioRepo;
        this.prefRepo = prefRepo;
        this.cloudinary = cloudinary;
        this.rolRepository = rolRepository;
        this.emailService=emailService;
    }

    public void registrarCliente(RegisterClientRequest req) {

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
        

        usuarioRepo.save(usuario);
        
        emailService.enviarCorreoRegistroCliente(usuario);
    }

    public ProfileResponse obtenerPerfil(String correo) {

        Usuario usuario = usuarioRepo.findByCorreo(correo)
                .orElseThrow();

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
            String fotoUrl
    ) {

        Usuario usuario = usuarioRepo.findByCorreo(correo)
                .orElseThrow();

        usuario.setNombres(req.getNombres());
        usuario.setApellidos(req.getApellidos());
        usuario.setTelefono(req.getTelefono());
        usuario.setWhatsapp(req.getWhatsapp());
        usuario.setDireccion(req.getDireccion());

        if (foto != null && !foto.isEmpty()) {
            try {
                usuario.setFotoPerfil(subirACloudinary(foto));
            } catch (IOException e) {
                throw new RuntimeException("Error subiendo archivo a Cloudinary", e);
            }
        } else if (fotoUrl != null && !fotoUrl.isEmpty()) {
            usuario.setFotoPerfil(fotoUrl);
        }

        usuarioRepo.save(usuario);

        PreferenciaUsuario pref = prefRepo
                .findByUsuario_IdUsuario(usuario.getIdUsuario())
                .orElse(new PreferenciaUsuario());

        pref.setUsuario(usuario);
        pref.setNotificacionesRfq(req.isNotificaciones());
        pref.setEntregaRapida(req.isEntregaRapida());
        pref.setFechaActualizacion(LocalDateTime.now());

        prefRepo.save(pref);
    }

    private String subirACloudinary(MultipartFile archivo) throws IOException {

        Map uploadResult = cloudinary.uploader().upload(
                archivo.getBytes(),
                ObjectUtils.asMap(
                        "folder", "b2b/perfil"
                )
        );

        return uploadResult.get("secure_url").toString();
    }
}