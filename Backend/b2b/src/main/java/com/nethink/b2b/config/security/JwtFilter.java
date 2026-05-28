package com.nethink.b2b.config.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;


import io.jsonwebtoken.Claims;






@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

  @Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain)
        throws ServletException, IOException {

    
    //System.out.println("=== ENTRA JWT FILTER ===");
//System.out.println("URI: " + request.getRequestURI());
    
    String path = request.getRequestURI();

    if (path.startsWith("/files/")) {
        filterChain.doFilter(request, response);
        return;
    }

    String authHeader = request.getHeader("Authorization");

    if (authHeader != null && authHeader.startsWith("Bearer ")) {

        String token = authHeader.substring(7);

        try {
            if (!jwtUtil.isTokenValid(token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
            
            //var claims = jwtUtil.parseToken(token);

//String correo = claims.getSubject();
//String rol = claims.get("rol", String.class);
 
//System.out.println("=== JWT DEBUG ===");
//System.out.println("CORREO: " + correo);
//System.out.println("ROL: " + rol);



            String correo = jwtUtil.extractCorreo(token);
            String rol = jwtUtil.extractRol(token);

            List<GrantedAuthority> authorities =
                    List.of(new SimpleGrantedAuthority("ROLE_" + rol));
            
            
            System.out.println("AUTHORITIES: " + authorities);
            
            

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(correo, null, authorities);
            
            
System.out.println("AUTH SETEADO CORRECTAMENTE");
System.out.println("IS AUTHENTICATED: " + auth.isAuthenticated());
            

            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (Exception e) {
            
            System.out.println("❌ ERROR JWT: " + e.getMessage());
            
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
    }

    filterChain.doFilter(request, response);
}
}