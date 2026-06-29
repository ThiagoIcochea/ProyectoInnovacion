package com.nethink.b2b.dto.request;

import org.springframework.web.multipart.MultipartFile;

public class ImagenProductoRequest {

    private MultipartFile archivo;

    private Boolean principal;

    public MultipartFile getArchivo() {
        return archivo;
    }

    public void setArchivo(MultipartFile archivo) {
        this.archivo = archivo;
    }

    public Boolean getPrincipal() {
        return principal;
    }

    public void setPrincipal(Boolean principal) {
        this.principal = principal;
    }
    
    

}