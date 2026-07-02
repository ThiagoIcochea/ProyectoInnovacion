package com.nethink.b2b.service;

import com.cloudinary.Cloudinary;
import com.nethink.b2b.dto.request.ActualizarReclamoRequest;
import com.nethink.b2b.dto.request.ReclamoRequest;
import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.entity.Reclamo;
import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.entity.SolicitudHistorial;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.ReclamoRepository;
import com.nethink.b2b.repository.SolicitudHistorialRepository;
import com.nethink.b2b.repository.SolicitudRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class ReclamoServiceTest {

    private ReclamoRepository reclamoRepository;
    private SolicitudRepository solicitudRepository;
    private SolicitudHistorialRepository historialRepository;
    private UsuarioRepository usuarioRepository;
    private EmailService emailService;
    private Cloudinary cloudinary;
    private ReclamoService reclamoService;

    @BeforeEach
    void setUp() {
        reclamoRepository = Mockito.mock(ReclamoRepository.class);
        solicitudRepository = Mockito.mock(SolicitudRepository.class);
        historialRepository = Mockito.mock(SolicitudHistorialRepository.class);
        usuarioRepository = Mockito.mock(UsuarioRepository.class);
        emailService = Mockito.mock(EmailService.class);
        cloudinary = Mockito.mock(Cloudinary.class);

        reclamoService = new ReclamoService(
                reclamoRepository,
                solicitudRepository,
                historialRepository,
                usuarioRepository,
                emailService,
                cloudinary
        );
    }

    @Test
    void registrarReclamoConAccionMantenerNoCambiaEstado() throws Exception {
        ReclamoRequest request = new ReclamoRequest();
        request.setIdSolicitud(10);
        request.setTipo("DEMORA");
        request.setDescripcion("Demora en entrega");
        request.setAccion("MANTENER");

        Usuario usuario = new Usuario();
        usuario.setIdUsuario(7);
        usuario.setCorreo("cliente@test.com");

        Proveedor proveedor = new Proveedor();
        proveedor.setIdProveedor(22);

        Solicitud solicitud = new Solicitud();
        solicitud.setIdSolicitud(10);
        solicitud.setEstado(Solicitud.EstadoSolicitud.EN_CAMINO);
        solicitud.setProveedor(proveedor);

        when(usuarioRepository.findByCorreo("cliente@test.com")).thenReturn(Optional.of(usuario));
        when(solicitudRepository.findById(10)).thenReturn(Optional.of(solicitud));
        when(reclamoRepository.save(any(Reclamo.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(solicitudRepository.save(any(Solicitud.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(historialRepository.save(any(SolicitudHistorial.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reclamoService.registrarReclamo(request, "cliente@test.com");

        assertEquals(Solicitud.EstadoSolicitud.EN_CAMINO, solicitud.getEstado());
    }

    @Test
    void registrarReclamoConReclamoActivoPrevioLanzaConflict() throws Exception {
        ReclamoRequest request = new ReclamoRequest();
        request.setIdSolicitud(10);
        request.setTipo("DEMORA");
        request.setDescripcion("Demora en entrega");
        request.setAccion("MANTENER");

        Usuario usuario = new Usuario();
        usuario.setIdUsuario(7);
        usuario.setCorreo("cliente@test.com");

        Proveedor proveedor = new Proveedor();
        proveedor.setIdProveedor(22);

        Solicitud solicitud = new Solicitud();
        solicitud.setIdSolicitud(10);
        solicitud.setEstado(Solicitud.EstadoSolicitud.EN_CAMINO);
        solicitud.setProveedor(proveedor);

        Reclamo activo = new Reclamo();
        activo.setIdReclamo(1);
        activo.setIdSolicitud(10);
        activo.setTipo("DEMORA");
        activo.setEstado("ABIERTO");

        when(usuarioRepository.findByCorreo("cliente@test.com")).thenReturn(Optional.of(usuario));
        when(solicitudRepository.findById(10)).thenReturn(Optional.of(solicitud));
        when(reclamoRepository.findByIdSolicitudAndTipoOrderByFechaCreacionDesc(10, "DEMORA")).thenReturn(List.of(activo));

        assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> reclamoService.registrarReclamo(request, "cliente@test.com"));
    }

    @Test
    void avanzarAEntregadaSinCodigoLanzaError() {
        Reclamo reclamo = new Reclamo();
        reclamo.setIdReclamo(100);
        reclamo.setIdSolicitud(10);
        reclamo.setIdProveedor(22);
        reclamo.setTipo("DEMORA");
        reclamo.setEstado("EN_REVISION");

        Solicitud solicitud = new Solicitud();
        solicitud.setIdSolicitud(10);
        solicitud.setEstado(Solicitud.EstadoSolicitud.EN_CAMINO);
        solicitud.setCodigoRecepcion("NP123456");

        ActualizarReclamoRequest request = new ActualizarReclamoRequest();
        request.setEstado("RESUELTO");
        request.setResolucion("Entregado");
        request.setAccion("AVANZAR");

        when(reclamoRepository.findById(100)).thenReturn(Optional.of(reclamo));
        when(reclamoRepository.save(any(Reclamo.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(solicitudRepository.findById(10)).thenReturn(Optional.of(solicitud));
        when(historialRepository.save(any(SolicitudHistorial.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> reclamoService.actualizarEstadoProveedor(100, 22, 7, request));
    }

    @Test
    void actualizarEstadoProveedorConResolucionResuelveYActualizaSolicitud() {
        Reclamo reclamo = new Reclamo();
        reclamo.setIdReclamo(99);
        reclamo.setIdSolicitud(10);
        reclamo.setIdProveedor(22);
        reclamo.setTipo("ENTREGA_INCOMPLETA");
        reclamo.setEstado("EN_REVISION");

        Solicitud solicitud = new Solicitud();
        solicitud.setIdSolicitud(10);
        solicitud.setEstado(Solicitud.EstadoSolicitud.EN_CAMINO);

        ActualizarReclamoRequest request = new ActualizarReclamoRequest();
        request.setEstado("RESUELTO");
        request.setResolucion("Se movio a preparacion");
        request.setAccion("EN_PREPARACION");

        when(reclamoRepository.findById(99)).thenReturn(Optional.of(reclamo));
        when(reclamoRepository.save(any(Reclamo.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(solicitudRepository.findById(10)).thenReturn(Optional.of(solicitud));
        when(historialRepository.save(any(SolicitudHistorial.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reclamoService.actualizarEstadoProveedor(99, 22, 7, request);

        assertEquals(Solicitud.EstadoSolicitud.EN_PREPARACION, solicitud.getEstado());
        assertEquals("RESUELTO", reclamo.getEstado());
    }
}
