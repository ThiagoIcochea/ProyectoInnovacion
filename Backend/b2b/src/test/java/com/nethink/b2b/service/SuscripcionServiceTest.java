package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.SuscripcionStatusResponse;
import com.nethink.b2b.entity.Plan;
import com.nethink.b2b.entity.PlanPrecio;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
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
        when(suscripcionRepo.findAll()).thenReturn(List.of());
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
}
