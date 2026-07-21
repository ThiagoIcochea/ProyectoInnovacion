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


    // =========================
    // INFORMACIÓN CLIENTE
    // =========================

    private String nombreCliente;


    // =========================
    // INDICADORES
    // =========================

    private ClienteSolicitudesIndicadorResponse solicitudes;

    private ClienteAprobadasIndicadorResponse aprobadas;


    // =========================
    // GRÁFICOS
    // =========================

    // Línea evolución solicitudes
    private List<ClienteSolicitudesMensualesResponse> graficoEvolucionSolicitudes;


    // Dona estados solicitudes
    private List<ClienteEstadoSolicitudResponse> graficoEstadosSolicitudes;


    // Barras horizontales productos más solicitados
    private List<ClienteProductoSolicitadoResponse> graficoProductosSolicitados;


    // Barras monto aprobado mensual
    private List<ClienteMontoAprobadoMensualResponse> graficoMontoAprobado;



    public ClienteDashboardResponse() {
    }


    public ClienteDashboardResponse(
            String nombreCliente,
            ClienteSolicitudesIndicadorResponse solicitudes,
            ClienteAprobadasIndicadorResponse aprobadas,
            List<ClienteSolicitudesMensualesResponse> graficoEvolucionSolicitudes,
            List<ClienteEstadoSolicitudResponse> graficoEstadosSolicitudes,
            List<ClienteProductoSolicitadoResponse> graficoProductosSolicitados,
            List<ClienteMontoAprobadoMensualResponse> graficoMontoAprobado
    ) {

        this.nombreCliente = nombreCliente;
        this.solicitudes = solicitudes;
        this.aprobadas = aprobadas;
        this.graficoEvolucionSolicitudes = graficoEvolucionSolicitudes;
        this.graficoEstadosSolicitudes = graficoEstadosSolicitudes;
        this.graficoProductosSolicitados = graficoProductosSolicitados;
        this.graficoMontoAprobado = graficoMontoAprobado;
    }



    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }


    public ClienteSolicitudesIndicadorResponse getSolicitudes() {
        return solicitudes;
    }

    public void setSolicitudes(ClienteSolicitudesIndicadorResponse solicitudes) {
        this.solicitudes = solicitudes;
    }


    public ClienteAprobadasIndicadorResponse getAprobadas() {
        return aprobadas;
    }

    public void setAprobadas(ClienteAprobadasIndicadorResponse aprobadas) {
        this.aprobadas = aprobadas;
    }


    public List<ClienteSolicitudesMensualesResponse> getGraficoEvolucionSolicitudes() {
        return graficoEvolucionSolicitudes;
    }

    public void setGraficoEvolucionSolicitudes(
            List<ClienteSolicitudesMensualesResponse> graficoEvolucionSolicitudes
    ) {
        this.graficoEvolucionSolicitudes = graficoEvolucionSolicitudes;
    }


    public List<ClienteEstadoSolicitudResponse> getGraficoEstadosSolicitudes() {
        return graficoEstadosSolicitudes;
    }

    public void setGraficoEstadosSolicitudes(
            List<ClienteEstadoSolicitudResponse> graficoEstadosSolicitudes
    ) {
        this.graficoEstadosSolicitudes = graficoEstadosSolicitudes;
    }


    public List<ClienteProductoSolicitadoResponse> getGraficoProductosSolicitados() {
        return graficoProductosSolicitados;
    }

    public void setGraficoProductosSolicitados(
            List<ClienteProductoSolicitadoResponse> graficoProductosSolicitados
    ) {
        this.graficoProductosSolicitados = graficoProductosSolicitados;
    }


    public List<ClienteMontoAprobadoMensualResponse> getGraficoMontoAprobado() {
        return graficoMontoAprobado;
    }

    public void setGraficoMontoAprobado(
            List<ClienteMontoAprobadoMensualResponse> graficoMontoAprobado
    ) {
        this.graficoMontoAprobado = graficoMontoAprobado;
    }


    
    
    
    
    
    
    
    
    
    
    
    
}
