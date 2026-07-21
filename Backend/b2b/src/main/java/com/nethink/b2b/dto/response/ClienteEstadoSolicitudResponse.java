/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.dto.response;

/**
 *
 * @author USUARIO
 */
public class ClienteEstadoSolicitudResponse {

   

    private String estado;

    private Long cantidad;


    public ClienteEstadoSolicitudResponse(
        String estado,
        Long cantidad
    ){
        this.estado = estado;
        this.cantidad = cantidad;
    }

 
public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Long getCantidad() {
        return cantidad;
    }

    public void setCantidad(Long cantidad) {
        this.cantidad = cantidad;
    }    
    
    
    
    
    
}
