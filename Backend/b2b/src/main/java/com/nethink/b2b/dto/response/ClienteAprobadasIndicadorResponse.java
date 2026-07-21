/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.dto.response;

import java.math.BigDecimal; 

/**
 *
 * @author USUARIO
 */
public class ClienteAprobadasIndicadorResponse {

    
   private Long aprobadasMesActual;
    private Long aprobadasMesAnterior;

    private BigDecimal montoMesActual;
    private BigDecimal montoMesAnterior;
    
    private Double porcentajeSolicitudesAprobadas;
    private Double porcentajeMontoAprobado;

    public ClienteAprobadasIndicadorResponse(
            Long aprobadasMesActual,
            Long aprobadasMesAnterior,
            BigDecimal montoMesActual,
            BigDecimal montoMesAnterior) {

        this.aprobadasMesActual = aprobadasMesActual;
        this.aprobadasMesAnterior = aprobadasMesAnterior;
        this.montoMesActual = montoMesActual;
        this.montoMesAnterior = montoMesAnterior;
    }

    // getters y setters
   
    public Long getAprobadasMesActual() {
        return aprobadasMesActual;
    }

    public void setAprobadasMesActual(Long aprobadasMesActual) {
        this.aprobadasMesActual = aprobadasMesActual;
    }


    public Long getAprobadasMesAnterior() {
        return aprobadasMesAnterior;
    }

    public void setAprobadasMesAnterior(Long aprobadasMesAnterior) {
        this.aprobadasMesAnterior = aprobadasMesAnterior;
    }


    public BigDecimal getMontoMesActual() {
        return montoMesActual;
    }

    public void setMontoMesActual(BigDecimal montoMesActual) {
        this.montoMesActual = montoMesActual;
    }


    public BigDecimal getMontoMesAnterior() {
        return montoMesAnterior;
    }

    public void setMontoMesAnterior(BigDecimal montoMesAnterior) {
        this.montoMesAnterior = montoMesAnterior;
    } 
    
    
    
  public Double getPorcentajeSolicitudesAprobadas() {
    return porcentajeSolicitudesAprobadas;
}

public void setPorcentajeSolicitudesAprobadas(Double porcentajeSolicitudesAprobadas) {
    this.porcentajeSolicitudesAprobadas = porcentajeSolicitudesAprobadas;
}

public Double getPorcentajeMontoAprobado() {
    return porcentajeMontoAprobado;
}

public void setPorcentajeMontoAprobado(Double porcentajeMontoAprobado) {
    this.porcentajeMontoAprobado = porcentajeMontoAprobado;
}  
    
    
    
    
    
}
