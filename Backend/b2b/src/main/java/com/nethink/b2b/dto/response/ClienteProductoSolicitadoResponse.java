/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.dto.response;

/**
 *
 * @author USUARIO
 */
public class ClienteProductoSolicitadoResponse {

   

    private String nombreProducto;

    private Integer cantidadSolicitada;


    public ClienteProductoSolicitadoResponse(
        String nombreProducto,
        Integer cantidadSolicitada
    ){
        this.nombreProducto = nombreProducto;
        this.cantidadSolicitada = cantidadSolicitada;
    }

 
    
    
    
    
    
}
