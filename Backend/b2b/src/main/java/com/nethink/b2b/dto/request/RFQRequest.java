package com.nethink.b2b.dto.request;

import java.util.List;
import com.nethink.b2b.entity.enums.PrioridadRFQ;

public class RFQRequest {

    private List<ItemRFQRequest> items;
    private FiltroRFQRequest filtro;
    private PrioridadRFQ prioridad;

    public RFQRequest() {
    }

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

    public PrioridadRFQ getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(PrioridadRFQ prioridad) {
        this.prioridad = prioridad;
    }
}
