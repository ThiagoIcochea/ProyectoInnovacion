/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.dto.response;

/**
 *
 * @author USUARIO
 */
public class ClienteSolicitudesMensualesResponse {

   

    private String mes;

    private Long cantidadSolicitudes;


    public ClienteSolicitudesMensualesResponse(
        String mes,
        Long cantidadSolicitudes
    ){
        this.mes = mes;
        this.cantidadSolicitudes = cantidadSolicitudes;
    }

 
    
    
    
    
    
}
