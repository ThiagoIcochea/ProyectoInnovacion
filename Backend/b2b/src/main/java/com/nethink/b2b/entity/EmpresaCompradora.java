package com.nethink.b2b.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "empresas_compradoras")
public class EmpresaCompradora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_empresa")
    private Integer idEmpresa;

    @Column(name = "razon_social", nullable = false, length = 150)
    private String razonSocial;

    @Column(name = "ruc", unique = true, length = 11)
    private String ruc;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_cliente")
    private TipoCliente tipoCliente = TipoCliente.EMPRESA;

    @Column(name = "rubro", length = 100)
    private String rubro;

    @Column(name = "nombre_contacto", length = 150)
    private String nombreContacto;

    @Column(name = "correo_empresa", length = 150)
    private String correoEmpresa;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Column(name = "direccion_fiscal", columnDefinition = "TEXT")
    private String direccionFiscal;

    @Column(name = "estado_contribuyente", length = 50)
    private String estadoContribuyente;

    @Column(name = "condicion_contribuyente", length = 50)
    private String condicionContribuyente;

    @Column(name = "validado_sunat")
    private Boolean validadoSunat = false;

    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado")
    private EstadoEmpresa estado = EstadoEmpresa.ACTIVO;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;

    public enum TipoCliente {
        EMPRESA,
        PERSONA_NATURAL,
        TERCERO
    }

    public enum EstadoEmpresa {
        ACTIVO,
        INACTIVO
    }

    public Integer getIdEmpresa() {
        return idEmpresa;
    }

    public void setIdEmpresa(Integer idEmpresa) {
        this.idEmpresa = idEmpresa;
    }

    public String getRazonSocial() {
        return razonSocial;
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = razonSocial;
    }

    public String getRuc() {
        return ruc;
    }

    public void setRuc(String ruc) {
        this.ruc = ruc;
    }

    public TipoCliente getTipoCliente() {
        return tipoCliente;
    }

    public void setTipoCliente(TipoCliente tipoCliente) {
        this.tipoCliente = tipoCliente;
    }

    public String getRubro() {
        return rubro;
    }

    public void setRubro(String rubro) {
        this.rubro = rubro;
    }

    public String getNombreContacto() {
        return nombreContacto;
    }

    public void setNombreContacto(String nombreContacto) {
        this.nombreContacto = nombreContacto;
    }

    public String getCorreoEmpresa() {
        return correoEmpresa;
    }

    public void setCorreoEmpresa(String correoEmpresa) {
        this.correoEmpresa = correoEmpresa;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getDireccionFiscal() {
        return direccionFiscal;
    }

    public void setDireccionFiscal(String direccionFiscal) {
        this.direccionFiscal = direccionFiscal;
    }

    public String getEstadoContribuyente() {
        return estadoContribuyente;
    }

    public void setEstadoContribuyente(String estadoContribuyente) {
        this.estadoContribuyente = estadoContribuyente;
    }

    public String getCondicionContribuyente() {
        return condicionContribuyente;
    }

    public void setCondicionContribuyente(String condicionContribuyente) {
        this.condicionContribuyente = condicionContribuyente;
    }

    public Boolean getValidadoSunat() {
        return validadoSunat;
    }

    public void setValidadoSunat(Boolean validadoSunat) {
        this.validadoSunat = validadoSunat;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public EstadoEmpresa getEstado() {
        return estado;
    }

    public void setEstado(EstadoEmpresa estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }
}