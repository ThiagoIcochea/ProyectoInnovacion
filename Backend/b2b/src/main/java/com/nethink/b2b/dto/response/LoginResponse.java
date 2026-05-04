package com.nethink.b2b.dto.response;

public class LoginResponse {

    private String token;
    private String correo;
    private String rol;
    private Integer idUsuario;

    public LoginResponse(String token, String correo, Integer idUsuario, String rol) {
        this.token = token;
        this.correo = correo;
        this.idUsuario = idUsuario;
        this.rol = rol;
    }

    public String getToken() {
        return token;
    }

    public String getCorreo() {
        return correo;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }
    public String getRol() {
        return rol;
    }
}