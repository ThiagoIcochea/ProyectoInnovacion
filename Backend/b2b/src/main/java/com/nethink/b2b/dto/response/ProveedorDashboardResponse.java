/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.dto.response;
import java.util.List;
import java.math.BigDecimal;

/**
 *
 * @author USUARIO
 */
public class ProveedorDashboardResponse {

 private Long solicitudesMesActual;

    private Long solicitudesMesAnterior;

    private Double porcentajeSolicitudes;
    
    private BigDecimal ingresosMesActual;
    private BigDecimal ingresosMesAnterior;
   private Double porcentajeIngresos;
   
   private Long solicitudesAprobadasMesActual; 
   private Long solicitudesAprobadasMesAnterior;
   private Double porcentajeSolicitudesAprobadas; 
    
    private List<IngresoMensualResponse> graficoIngresos;
    private List<ProductoMasVendidoResponse> productosMasVendidos;
    
    private String nombreProveedor; 
    
    
    

    public ProveedorDashboardResponse() {
        
    }

    // getters y setters

    
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

    public BigDecimal getIngresosMesActual() {
        return ingresosMesActual;
    }

    public void setIngresosMesActual(BigDecimal ingresosMesActual) {
        this.ingresosMesActual = ingresosMesActual;
    }

    public BigDecimal getIngresosMesAnterior() {
        return ingresosMesAnterior;
    }

    public void setIngresosMesAnterior(BigDecimal ingresosMesAnterior) {
        this.ingresosMesAnterior = ingresosMesAnterior;
    }

    public Double getPorcentajeIngresos() {
        return porcentajeIngresos;
    }

    public void setPorcentajeIngresos(Double porcentajeIngresos) {
        this.porcentajeIngresos = porcentajeIngresos;
    } 
    
    
    public Long getSolicitudesAprobadasMesActual() {
        return solicitudesAprobadasMesActual;
    }

    public void setSolicitudesAprobadasMesActual(Long solicitudesAprobadasMesActual) {
        this.solicitudesAprobadasMesActual = solicitudesAprobadasMesActual;
    }

    public Long getSolicitudesAprobadasMesAnterior() {
        return solicitudesAprobadasMesAnterior;
    }

    public void setSolicitudesAprobadasMesAnterior(Long solicitudesAprobadasMesAnterior) {
        this.solicitudesAprobadasMesAnterior = solicitudesAprobadasMesAnterior;
    }

    public Double getPorcentajeSolicitudesAprobadas() {
        return porcentajeSolicitudesAprobadas;
    }

    public void setPorcentajeSolicitudesAprobadas(Double porcentajeSolicitudesAprobadas) {
        this.porcentajeSolicitudesAprobadas = porcentajeSolicitudesAprobadas;
    }
    
    
    public List<IngresoMensualResponse> getGraficoIngresos() {
    return graficoIngresos;
}
     

public void setGraficoIngresos(List<IngresoMensualResponse> graficoIngresos) {
    this.graficoIngresos = graficoIngresos;
}   
    
 public List<ProductoMasVendidoResponse> getProductosMasVendidos() {
    return productosMasVendidos;
}

public void setProductosMasVendidos(List<ProductoMasVendidoResponse> productosMasVendidos) {
    this.productosMasVendidos = productosMasVendidos;
}   
    
    
 public String getNombreProveedor(){
 
   return nombreProveedor;  
 }   
    
 public void setNombreProveedor(String nombreProveedor){
   
     this.nombreProveedor=nombreProveedor; 
     
 }
 
 
 
    
}
