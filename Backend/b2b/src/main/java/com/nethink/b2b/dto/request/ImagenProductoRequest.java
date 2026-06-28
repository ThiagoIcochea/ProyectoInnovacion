package com.nethink.b2b.dto.request;

public class ImagenProductoRequest {

    private String url;

    private Boolean principal;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Boolean getPrincipal() {
        return principal;
    }

    public void setPrincipal(Boolean principal) {
        this.principal = principal;
    }

}