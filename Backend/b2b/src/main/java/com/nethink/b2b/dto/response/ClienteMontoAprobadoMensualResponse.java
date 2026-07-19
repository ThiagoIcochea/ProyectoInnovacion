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
public class ClienteMontoAprobadoMensualResponse {

  


    private String mes;

    private BigDecimal monto;


    public ClienteMontoAprobadoMensualResponse(
        String mes,
        BigDecimal monto
    ){
        this.mes = mes;
        this.monto = monto;
    }

  
    
    
    
    
}
