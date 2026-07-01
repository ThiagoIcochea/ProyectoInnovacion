package com.nethink.b2b.dto.request;

public class ActualizarReclamoRequest {

    private String estado;
    private String resolucion;

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getResolucion() {
        return resolucion;
    }

    public void setResolucion(String resolucion) {
        this.resolucion = resolucion;
    }
}
