package com.nethink.b2b.service;

import com.nethink.b2b.config.security.JwtUtil;
import com.nethink.b2b.dto.response.LoginResponse;
import com.nethink.b2b.dto.response.MfaStartResponse;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.entity.enums.EstadoUsuario;
import com.nethink.b2b.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository repo;

    @Autowired
    private LogsSistemaService logsSistemaService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private MfaService mfaService;

    @Autowired
    private LoginSecurityService loginSecurityService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public MfaStartResponse login(String correo, String password, HttpServletRequest request) {

        String ip = loginSecurityService.obtenerIp(request);
        loginSecurityService.validarIp(ip);

        Usuario user = repo.findByCorreo(correo).orElse(null);
        if (user == null) {
            loginSecurityService.registrarFallo(correo, null, ip);
            throw new RuntimeException("Credenciales incorrectas");
        }

        loginSecurityService.validarUsuario(user.getCorreo());

        if (user.getEstado() != EstadoUsuario.ACTIVO) {
            logsSistemaService.registrarLog(
                    user.getIdUsuario(),
                    "LOGIN",
                    "AUTH",
                    "Login no exitoso por usuario inactivo",
                    request
            );
            if (user.getEstado() == EstadoUsuario.BLOQUEADO) {
                throw new RuntimeException("Se han detectado gestiones inapropiadas por las cuales la cuenta ha sido suspendida. Contactese con el administrador.");
            }
            throw new RuntimeException("Usuario inactivo");
        }

        boolean passwordMatches = passwordEncoder.matches(password, user.getPassword())
                || user.getPassword().equals(password);

        if (!passwordMatches) {
            loginSecurityService.registrarFallo(user.getCorreo(), user, ip);
            logsSistemaService.registrarLog(
                    user.getIdUsuario(),
                    "LOGIN",
                    "AUTH",
                    "Login no exitoso por password erroneo",
                    request
            );
            throw new RuntimeException("Credenciales incorrectas");
        }

        loginSecurityService.registrarExito(user.getCorreo(), ip);

        return mfaService.start(
                user.getCorreo(),
                MfaService.PURPOSE_LOGIN,
                "email",
                redirectByRole(user.getRol().getNombre()),
                false,
                null
        );
    }

    public LoginResponse completeLogin(String correo, HttpServletRequest request) {
        Usuario user = repo.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (user.getEstado() != EstadoUsuario.ACTIVO) {
            throw new RuntimeException("Usuario inactivo o bloqueado");
        }

        String token = jwtUtil.generateToken(user.getCorreo(), user.getRol().getNombre());

        logsSistemaService.registrarLog(
                user.getIdUsuario(),
                "LOGIN",
                "AUTH",
                "Inicio de sesion exitoso con MFA",
                request
        );

        return new LoginResponse(token, user.getCorreo(), user.getIdUsuario(), user.getRol().getNombre());
    }

    private String redirectByRole(String rol) {
        String normalized = String.valueOf(rol == null ? "" : rol).toUpperCase().replace("ROLE_", "");

        return switch (normalized) {
            case "ADMIN" -> "/app/admin/dashboard";
            case "PROVEEDOR" -> "/app/provider/dashboard";
            default -> "/app/dashboard";
        };
    }
}
