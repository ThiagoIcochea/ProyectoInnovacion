package com.nethink.b2b.service;

import com.nethink.b2b.entity.InventarioReserva;
import com.nethink.b2b.entity.ProveedorProducto;
import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.repository.InventarioReservaRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class InventarioReservaServiceTest {

    private InventarioReservaRepository reservaRepo;
    private ProveedorProductoRepository proveedorProductoRepo;
    private InventarioReservaService service;

    @BeforeEach
    void setUp() {
        reservaRepo = Mockito.mock(InventarioReservaRepository.class);
        proveedorProductoRepo = Mockito.mock(ProveedorProductoRepository.class);
        service = new InventarioReservaService(reservaRepo, proveedorProductoRepo);
    }

    @Test
    void cancelarReservaDevuelveStockYMarcaReservaComoCancelada() {
        ProveedorProducto pp = new ProveedorProducto();
        pp.setIdProvProd(11);
        pp.setStock(10);

        Solicitud solicitud = new Solicitud();
        solicitud.setIdSolicitud(77);

        InventarioReserva reserva = new InventarioReserva();
        reserva.setSolicitud(solicitud);
        reserva.setProveedorProducto(pp);
        reserva.setCantidad(4);
        reserva.setEstado("RESERVADO");

        when(reservaRepo.findBySolicitud_IdSolicitud(77)).thenReturn(List.of(reserva));
        when(proveedorProductoRepo.save(any(ProveedorProducto.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservaRepo.save(any(InventarioReserva.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.cancelarReserva(77);

        assertEquals(14, pp.getStock());
        assertEquals("CANCELADO", reserva.getEstado());
    }
}
