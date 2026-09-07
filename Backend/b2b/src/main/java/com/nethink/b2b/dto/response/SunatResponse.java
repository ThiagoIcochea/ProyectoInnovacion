package com.nethink.b2b.dto.response;

public class SunatResponse {

    private String ruc;

    private String razonSocial;

    private String direccion;

    private String estado;

    private String condicion;

    public String getRuc() {
        return ruc;
    }

    public void setRuc(String ruc) {
        this.ruc = ruc;
    }

    public String getRazonSocial() {
        return razonSocial;
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = razonSocial;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getCondicion() {
        return condicion;
    }

    public void setCondicion(String condicion) {
        this.condicion = condicion;
    }
public String getDescripcion() {
    java.util.List<String> detalles = new java.util.ArrayList<>();

    if (getEstado() != null && !getEstado().isBlank()) {
        detalles.add("Estado SUNAT: " + getEstado().trim());
    }
    if (getCondicion() != null && !getCondicion().isBlank()) {
        detalles.add("condicion: " + getCondicion().trim());
    }
    if (getDireccion() != null && !getDireccion().isBlank()) {
        detalles.add("domicilio fiscal: " + getDireccion().trim());
    }

    String descripcion = detalles.isEmpty()
            ? "Empresa validada mediante consulta SUNAT."
            : String.join("; ", detalles) + ".";

    return descripcion.length() <= 250 ? descripcion : descripcion.substring(0, 247) + "...";
}

}
