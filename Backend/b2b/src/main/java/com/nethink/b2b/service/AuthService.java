package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.LoginResponse;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.entity.enums.EstadoUsuario;
import com.nethink.b2b.repository.UsuarioRepository;
import com.nethink.b2b.config.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository repo;

    @Autowired
    private JwtUtil jwtUtil;

    public LoginResponse login(String correo, String password) {

        Usuario user = repo.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    
        if (user.getEstado() != EstadoUsuario.ACTIVO) {
            throw new RuntimeException("Usuario inactivo");
        }

      
        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Password incorrecto");
        }

        
        String token = jwtUtil.generateToken(user.getCorreo(),user.getRol().getNombre());

        
        return new LoginResponse(token, user.getCorreo(), user.getIdUsuario());
    }
}