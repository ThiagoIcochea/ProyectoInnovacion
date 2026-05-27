/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.dto.response;

/**
 *
 * @author thico
 */
public class IndicadorProveedorResponse {

    private Integer idProveedor;
    private String razonSocial;

    private int pedidosCompletados;
    private int pedidosTotal;

    private double cumplimiento;
    private double scoreGeneral;

    public Integer getIdProveedor() {
        return idProveedor;
    }

    public void setIdProveedor(Integer idProveedor) {
        this.idProveedor = idProveedor;
    }

    public String getRazonSocial() {
        return razonSocial;
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = razonSocial;
    }

    public int getPedidosCompletados() {
        return pedidosCompletados;
    }

    public void setPedidosCompletados(int pedidosCompletados) {
        this.pedidosCompletados = pedidosCompletados;
    }

    public int getPedidosTotal() {
        return pedidosTotal;
    }

    public void setPedidosTotal(int pedidosTotal) {
        this.pedidosTotal = pedidosTotal;
    }

    public double getCumplimiento() {
        return cumplimiento;
    }

    public void setCumplimiento(double cumplimiento) {
        this.cumplimiento = cumplimiento;
    }

    public double getScoreGeneral() {
        return scoreGeneral;
    }

    public void setScoreGeneral(double scoreGeneral) {
        this.scoreGeneral = scoreGeneral;
    }

   
}