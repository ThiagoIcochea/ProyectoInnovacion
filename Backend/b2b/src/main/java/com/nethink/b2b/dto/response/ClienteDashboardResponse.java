/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.dto.response;
import java.math.BigDecimal;
import java.util.List;

/**
 *
 * @author USUARIO
 */
public class ClienteDashboardResponse {



    // ============================
    // INDICADORES PRINCIPALES
    // ============================

    private String nombreCliente;

    // Solicitudes
    private Long solicitudesMesActual;
    private Long solicitudesMesAnterior;
    private Double porcentajeSolicitudes;

    // Solicitudes aprobadas
    private Long solicitudesAprobadasMesActual;
    private Long solicitudesAprobadasMesAnterior;
    private Double porcentajeSolicitudesAprobadas;

    // Dinero aprobado
    private BigDecimal montoAprobadoMesActual;
    private BigDecimal montoAprobadoMesAnterior;
    private Double porcentajeMontoAprobado;


    // ============================
    // GRÁFICOS
    // ============================

    // Línea: evolución de solicitudes
    private List<ClienteSolicitudesMensualesResponse> graficoEvolucionSolicitudes;


    // Dona: estados de solicitudes
    private List<ClienteEstadoSolicitudResponse> graficoEstadosSolicitudes;


    // Barras horizontales: productos más solicitados
    private List<ClienteProductoSolicitadoResponse> graficoProductosSolicitados;


    // Barras: monto aprobado por mes
    private List<ClienteMontoAprobadoMensualResponse> graficoMontoAprobado;


    // getters y setters
    
   public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
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

    public BigDecimal getMontoAprobadoMesActual() {
        return montoAprobadoMesActual;
    }

    public void setMontoAprobadoMesActual(BigDecimal montoAprobadoMesActual) {
        this.montoAprobadoMesActual = montoAprobadoMesActual;
    }

    public BigDecimal getMontoAprobadoMesAnterior() {
        return montoAprobadoMesAnterior;
    }

    public void setMontoAprobadoMesAnterior(BigDecimal montoAprobadoMesAnterior) {
        this.montoAprobadoMesAnterior = montoAprobadoMesAnterior;
    }

    public Double getPorcentajeMontoAprobado() {
        return porcentajeMontoAprobado;
    }

    public void setPorcentajeMontoAprobado(Double porcentajeMontoAprobado) {
        this.porcentajeMontoAprobado = porcentajeMontoAprobado;
    }

    public List<ClienteSolicitudesMensualesResponse> getGraficoEvolucionSolicitudes() {
        return graficoEvolucionSolicitudes;
    }

    public void setGraficoEvolucionSolicitudes(List<ClienteSolicitudesMensualesResponse> graficoEvolucionSolicitudes) {
        this.graficoEvolucionSolicitudes = graficoEvolucionSolicitudes;
    }

    public List<ClienteEstadoSolicitudResponse> getGraficoEstadosSolicitudes() {
        return graficoEstadosSolicitudes;
    }

    public void setGraficoEstadosSolicitudes(List<ClienteEstadoSolicitudResponse> graficoEstadosSolicitudes) {
        this.graficoEstadosSolicitudes = graficoEstadosSolicitudes;
    }

    public List<ClienteProductoSolicitadoResponse> getGraficoProductosSolicitados() {
        return graficoProductosSolicitados;
    }

    public void setGraficoProductosSolicitados(List<ClienteProductoSolicitadoResponse> graficoProductosSolicitados) {
        this.graficoProductosSolicitados = graficoProductosSolicitados;
    }

    public List<ClienteMontoAprobadoMensualResponse> getGraficoMontoAprobado() {
        return graficoMontoAprobado;
    }

    public void setGraficoMontoAprobado(List<ClienteMontoAprobadoMensualResponse> graficoMontoAprobado) {
        this.graficoMontoAprobado = graficoMontoAprobado;
    } 
    
    
    
    
    
    
    
    
    
    
    
    
}
