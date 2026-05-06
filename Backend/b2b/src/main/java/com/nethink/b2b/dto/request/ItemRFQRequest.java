package com.nethink.b2b.dto.request;

public class ItemRFQRequest {

    private Integer idProducto;
    private Integer cantidad;

    public ItemRFQRequest() {
    }

    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
}
