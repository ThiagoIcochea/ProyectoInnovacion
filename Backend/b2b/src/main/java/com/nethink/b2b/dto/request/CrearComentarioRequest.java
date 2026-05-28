package com.nethink.b2b.dto.request;

public class CrearComentarioRequest {

    private Integer idProvProd;
    private Integer idUsuario;
    private String comentario;

    public Integer getIdProvProd() {
        return idProvProd;
    }

    public void setIdProvProd(Integer idProvProd) {
        this.idProvProd = idProvProd;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }
}