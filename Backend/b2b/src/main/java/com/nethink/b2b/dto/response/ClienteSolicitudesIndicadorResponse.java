/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.dto.response;

/**
 *
 * @author USUARIO
 */
public class ClienteSolicitudesIndicadorResponse {

 

    private Long solicitudesMesActual;
    private Long solicitudesMesAnterior;
    
    private Double porcentajeSolicitudes; 

    public ClienteSolicitudesIndicadorResponse(
            Long solicitudesMesActual,
            Long solicitudesMesAnterior) {

        this.solicitudesMesActual = solicitudesMesActual;
        this.solicitudesMesAnterior = solicitudesMesAnterior;
    }

    public Long getSolicitudesMesActual() {
        return solicitudesMesActual;
    }

    public void setSolicitudesMesActual(Long solicitudesMesActual) {
        this.solicitudesMesActual = solicitudesMesActual;
    }

    public Long getSolicitudesMesAnterior() {
        return solicitudesMesAnterior;
    }

    public void setSolicitudesMesAnterior(Long solicitudesMesAnterior) {
        this.solicitudesMesAnterior = solicitudesMesAnterior;
    }
   
    
   public Double getPorcentajeSolicitudes() {
    return porcentajeSolicitudes;
}

public void setPorcentajeSolicitudes(Double porcentajeSolicitudes) {
    this.porcentajeSolicitudes = porcentajeSolicitudes;
} 
    
    
    
    
    
    
    
    
    
}
