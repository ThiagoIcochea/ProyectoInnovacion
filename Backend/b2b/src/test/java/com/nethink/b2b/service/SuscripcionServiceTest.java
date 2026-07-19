package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.SuscripcionStatusResponse;
import com.nethink.b2b.entity.Plan;
import com.nethink.b2b.entity.PlanPrecio;
import com.nethink.b2b.entity.Suscripcion;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.PlanPrecioRepository;
import com.nethink.b2b.repository.PlanRepository;
import com.nethink.b2b.repository.SuscripcionRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SuscripcionServiceTest {

    @Mock
    private SuscripcionRepository suscripcionRepo;

    @Mock
    private PlanPrecioRepository precioRepo;

    @Mock
    private UsuarioRepository usuarioRepo;

    @Mock
    private PlanRepository planRepo;

    @Mock
    private PayPalService payPalService;

    @InjectMocks
    private SuscripcionService suscripcionService;

    @Test
    void debeRetornarFreemiumPorDefectoCuandoNoHaySuscripcion() {
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(1);

        when(usuarioRepo.findById(1)).thenReturn(Optional.of(usuario));
        when(suscripcionRepo.findByUsuario_IdUsuarioOrderByFechaCreacionDesc(1)).thenReturn(List.of());
        when(planRepo.findById(any())).thenReturn(Optional.empty());
        when(precioRepo.findByPlan_IdPlanAndPeriodoMesesAndActivoTrue(anyInt(), anyInt())).thenReturn(Optional.empty());
        when(precioRepo.save(any(PlanPrecio.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(planRepo.save(any(Plan.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SuscripcionStatusResponse response = suscripcionService.obtenerEstadoSuscripcion(1);

        assertThat(response.getEstado()).isEqualTo("ACTIVA");
        assertThat(response.getPlan()).isEqualTo("Freemium");
        assertThat(response.getBloqueado()).isFalse();
        assertThat(response.getDiasRestantes()).isGreaterThan(0);
    }

    @Test
    void noDebeCrearOtraSuscripcionCuandoYaExisteUnaActiva() {
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(1);

        Suscripcion activa = new Suscripcion();
        activa.setIdSuscripcion(10);
        activa.setUsuario(usuario);
        activa.setEstado(Suscripcion.EstadoSuscripcion.ACTIVA);
        activa.setMontoPagado(new BigDecimal("500.00"));
        activa.setFechaCreacion(LocalDateTime.now());
        activa.setFechaFin(LocalDateTime.now().plusDays(30));

        Plan plan = new Plan();
        plan.setIdPlan(3);
        plan.setNombre("Premium");

        PlanPrecio precio = new PlanPrecio();
        precio.setIdPrecio(5);
        precio.setPlan(plan);
        precio.setPrecio(new BigDecimal("500.00"));
        activa.setPrecio(precio);

        when(usuarioRepo.findById(1)).thenReturn(Optional.of(usuario));
        when(suscripcionRepo.findByUsuario_IdUsuarioOrderByFechaCreacionDesc(1)).thenReturn(List.of(activa));

        SuscripcionStatusResponse response = suscripcionService.obtenerEstadoSuscripcion(1);

        assertThat(response.getEstado()).isEqualTo("ACTIVA");
        assertThat(response.getPlan()).isEqualTo("Premium");
        assertThat(response.getIdPrecio()).isEqualTo(5);
        verify(suscripcionRepo, never()).save(any(Suscripcion.class));
    }
}
