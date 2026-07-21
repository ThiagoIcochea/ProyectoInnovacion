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

    private Long cantidadSolicitada;


    public ClienteProductoSolicitadoResponse(
        String nombreProducto,
        Long cantidadSolicitada
    ){
        this.nombreProducto = nombreProducto;
        this.cantidadSolicitada = cantidadSolicitada;
    }

 
   public String getNombreProducto() {
        return nombreProducto;
    }


    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }


    public Long getCantidadSolicitada() {
        return cantidadSolicitada;
    }


    public void setCantidadSolicitada(Long cantidadSolicitada) {
        this.cantidadSolicitada = cantidadSolicitada;
    } 
    
    
    
    
}
