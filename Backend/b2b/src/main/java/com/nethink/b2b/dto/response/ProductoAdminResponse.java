package com.nethink.b2b.dto.response;

public class ProductoAdminResponse {

    private Integer idProducto;
    private String name;
    private String brand;
    private String category;

    private Integer providersCount;
    private Integer totalStock;

    private String status;

    public ProductoAdminResponse() {
    }

    public Integer getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Integer idProducto) {
        this.idProducto = idProducto;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getProvidersCount() {
        return providersCount;
    }

    public void setProvidersCount(Integer providersCount) {
        this.providersCount = providersCount;
    }

    public Integer getTotalStock() {
        return totalStock;
    }

    public void setTotalStock(Integer totalStock) {
        this.totalStock = totalStock;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}