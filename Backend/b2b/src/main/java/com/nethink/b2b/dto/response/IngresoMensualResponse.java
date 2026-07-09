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
public class IngresoMensualResponse {

    
  private String mes;
    private BigDecimal ingresos;  
    
  public IngresoMensualResponse() {
    }

    public IngresoMensualResponse(String mes, BigDecimal ingresos) {
        this.mes = mes;
        this.ingresos = ingresos;
    }

    public String getMes() {
        return mes;
    }

    public void setMes(String mes) {
        this.mes = mes;
    }

    public BigDecimal getIngresos() {
        return ingresos;
    }

    public void setIngresos(BigDecimal ingresos) {
        this.ingresos = ingresos;
    }    
    
    
    
    
    
    
    
}
