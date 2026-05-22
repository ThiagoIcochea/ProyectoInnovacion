/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.dto.response;

import java.util.List; 

/**
 *
 * @author USUARIO
 */
public class DetalleSolicitudResponse {

    
    private Integer cantidad;
    private String nombreProducto;
    private String categoria;
    
    // se añadio 19 mayo val
    private String marca; 
    private List<EspecificacionResponse> especificaciones;

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }
    
    
    public String getMarca(){
    
       return marca; 
    }
    
    
    public void setMarca(String marca){
    
    this.marca=marca; 
    
    
    }
    
    
    
    
  public List<EspecificacionResponse> getEspecificaciones() {
        return especificaciones;
    }

    public void setEspecificaciones(List<EspecificacionResponse> especificaciones) {
        this.especificaciones = especificaciones;
    }  
    
    
    
    
}
