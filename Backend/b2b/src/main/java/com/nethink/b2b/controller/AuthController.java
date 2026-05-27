package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.LoginRequest;
import com.nethink.b2b.dto.request.RegisterProviderRequest;
import com.nethink.b2b.dto.response.LoginResponse;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService service;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request,HttpServletRequest httpRequest) {
        return service.login(request.getCorreo(), request.getPassword(),httpRequest);
    }
    
  
}