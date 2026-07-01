/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.dto.request;

import org.springframework.web.multipart.MultipartFile;


public class ReclamoRequest {

    private Integer idSolicitud;

    private String descripcion;

    private String tipo;
    
    private MultipartFile evidencia;

public MultipartFile getEvidencia() {
    return evidencia;
}

public void setEvidencia(MultipartFile evidencia) {
    this.evidencia = evidencia;
}

    public Integer getIdSolicitud() {
        return idSolicitud;
    }

    public void setIdSolicitud(Integer idSolicitud) {
        this.idSolicitud = idSolicitud;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    
}