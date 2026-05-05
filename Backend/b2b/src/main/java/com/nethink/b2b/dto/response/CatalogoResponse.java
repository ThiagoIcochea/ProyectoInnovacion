package com.nethink.b2b.dto.response;

import java.util.List;

public class CatalogoResponse {

    private String producto;
    private String marca;
    private String categoria;

    private String proveedor;
    private Double precio;
    private Integer stock;
    private Integer tiempoEntrega;

    private Double porcentajeDescuento;

    private List<EspecificacionResponse> especificaciones;
    private List<DescuentoVolumenResponse> descuentosVolumen;
    
    private List<ImagenResponse> imagenes;


    public CatalogoResponse() {}

    public String getProducto() { return producto; }
    public void setProducto(String producto) { this.producto = producto; }

    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getProveedor() { return proveedor; }
    public void setProveedor(String proveedor) { this.proveedor = proveedor; }

    public Double getPrecio() { return precio; }
    public void setPrecio(Double precio) { this.precio = precio; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public Integer getTiempoEntrega() { return tiempoEntrega; }
    public void setTiempoEntrega(Integer tiempoEntrega) { this.tiempoEntrega = tiempoEntrega; }

    public Double getPorcentajeDescuento() { return porcentajeDescuento; }
    public void setPorcentajeDescuento(Double porcentajeDescuento) { this.porcentajeDescuento = porcentajeDescuento; }

    public List<EspecificacionResponse> getEspecificaciones() { return especificaciones; }
    public void setEspecificaciones(List<EspecificacionResponse> especificaciones) { this.especificaciones = especificaciones; }

    public List<DescuentoVolumenResponse> getDescuentosVolumen() { return descuentosVolumen; }
    public void setDescuentosVolumen(List<DescuentoVolumenResponse> descuentosVolumen) { this.descuentosVolumen = descuentosVolumen; }

        
public List<ImagenResponse> getImagenes() {
    return imagenes;
}

public void setImagenes(List<ImagenResponse> imagenes) {
    this.imagenes = imagenes;
}
}