package com.nethink.b2b.dto.request;

import java.util.List;

public class RFQRequest {

    private List<ItemRFQRequest> items;
    private FiltroRFQRequest filtro;

    public List<ItemRFQRequest> getItems() {
        return items;
    }

    public void setItems(List<ItemRFQRequest> items) {
        this.items = items;
    }

    public FiltroRFQRequest getFiltro() {
        return filtro;
    }

    public void setFiltro(FiltroRFQRequest filtro) {
        this.filtro = filtro;
    }
}