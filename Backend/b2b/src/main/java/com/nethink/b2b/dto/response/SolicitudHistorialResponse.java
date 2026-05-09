package com.nethink.b2b.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SolicitudHistorialResponse {

    private Integer idSolicitud;
    private Integer idProveedor;

    private String nombreProveedor;

    private BigDecimal total;

    private String estado;

    private String descripcionEstado;

    private LocalDateTime fechaCreacion;

    private LocalDateTime fechaActualizacionEstado;

    public Integer getIdSolicitud() {
        return idSolicitud;
    }

    public void setIdSolicitud(Integer idSolicitud) {
        this.idSolicitud = idSolicitud;
    }

    public Integer getIdProveedor() {
        return idProveedor;
    }

    public void setIdProveedor(Integer idProveedor) {
        this.idProveedor = idProveedor;
    }

    public String getNombreProveedor() {
        return nombreProveedor;
    }

    public void setNombreProveedor(String nombreProveedor) {
        this.nombreProveedor = nombreProveedor;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getDescripcionEstado() {
        return descripcionEstado;
    }

    public void setDescripcionEstado(String descripcionEstado) {
        this.descripcionEstado = descripcionEstado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaActualizacionEstado() {
        return fechaActualizacionEstado;
    }

    public void setFechaActualizacionEstado(LocalDateTime fechaActualizacionEstado) {
        this.fechaActualizacionEstado = fechaActualizacionEstado;
    }
}