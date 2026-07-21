/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.service;

import org.springframework.stereotype.Service;

import com.nethink.b2b.repository.UsuarioRepository; 
import com.nethink.b2b.repository.SolicitudRepository; 
import com.nethink.b2b.repository.SolicitudHistorialRepository;
import com.nethink.b2b.dto.response.ClienteDashboardResponse;
import com.nethink.b2b.dto.response.ClienteSolicitudesIndicadorResponse;
import com.nethink.b2b.dto.response.ClienteAprobadasIndicadorResponse;
import com.nethink.b2b.dto.response.ClienteMontoAprobadoMensualProjection;
import com.nethink.b2b.dto.response.ClienteSolicitudesMensualesProjection; 
import com.nethink.b2b.dto.response.ClienteMontoAprobadoMensualResponse;
import com.nethink.b2b.dto.response.ClienteSolicitudesMensualesResponse; 
import java.util.List; 

import com.nethink.b2b.entity.Usuario;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.math.RoundingMode;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;




/**
 *
 * @author USUARIO
 */


@Service
public class ClienteDashboardService {

    
    
  private final SolicitudHistorialRepository historialRepo;

    private final SolicitudRepository solicitudRepo;

    private final UsuarioRepository usuarioRepo;


    public ClienteDashboardService(
            SolicitudHistorialRepository historialRepo,
            SolicitudRepository solicitudRepo,
            UsuarioRepository usuarioRepo
    ) {
        this.historialRepo = historialRepo;
        this.solicitudRepo = solicitudRepo;
        this.usuarioRepo = usuarioRepo;
    }



    public ClienteDashboardResponse clienteObtenerDashboard(Integer idUsuario) {


        // ==========================
        // CLIENTE
        // ==========================

        Usuario usuario = usuarioRepo.findById(idUsuario)
                .orElseThrow(() -> 
                    new RuntimeException("Cliente no encontrado")
                );


        ClienteDashboardResponse response =
                new ClienteDashboardResponse();


        response.setNombreCliente(
                usuario.getNombres()
        );



        // ==========================
        // FECHAS
        // ==========================


        LocalDate hoy = LocalDate.now();


        LocalDateTime inicioMesActual =
                hoy.withDayOfMonth(1)
                   .atStartOfDay();


        LocalDateTime finMesActual =
                hoy.plusMonths(1)
                   .withDayOfMonth(1)
                   .atStartOfDay();



        LocalDateTime inicioMesAnterior =
                hoy.minusMonths(1)
                   .withDayOfMonth(1)
                   .atStartOfDay();



        LocalDateTime finMesAnterior =
                hoy.withDayOfMonth(1)
                   .atStartOfDay();



        // últimos 6 meses para gráficos

        LocalDateTime inicioSeisMeses =
                hoy.minusMonths(5)
                   .withDayOfMonth(1)
                   .atStartOfDay();



        // ==========================
        // INDICADOR SOLICITUDES
        // ==========================


        ClienteSolicitudesIndicadorResponse solicitudes =
                historialRepo.obtenerIndicadorSolicitudes(
                        idUsuario,
                        inicioMesActual,
                        finMesActual,
                        inicioMesAnterior,
                        finMesAnterior
                );


        solicitudes.setPorcentajeSolicitudes(
        calcularPorcentaje(
                solicitudes.getSolicitudesMesActual(),
                solicitudes.getSolicitudesMesAnterior()
        )
);
        
        response.setSolicitudes(
                solicitudes
        );


//        response.setSolicitudesMesAnterior(
//                solicitudes.getSolicitudesMesAnterior()
//        );



//        response.setPorcentajeSolicitudes(
//                calcularPorcentaje(
//                    solicitudes.getSolicitudesMesActual(),
//                    solicitudes.getSolicitudesMesAnterior()
//                )
//        );




        // ==========================
        // INDICADOR APROBADAS
        // ==========================

        
        
        
        ClienteAprobadasIndicadorResponse aprobadas =
                historialRepo.obtenerIndicadorAprobadas(
                        idUsuario,
                        inicioMesActual,
                        finMesActual,
                        inicioMesAnterior,
                        finMesAnterior
                );


  aprobadas.setPorcentajeSolicitudesAprobadas(
        calcularPorcentaje(
                aprobadas.getAprobadasMesActual(),
                aprobadas.getAprobadasMesAnterior()
        )
);

aprobadas.setPorcentajeMontoAprobado(
        calcularPorcentajeMonto(
                aprobadas.getMontoMesActual(),
                aprobadas.getMontoMesAnterior()
        )
);      
        
  response.setAprobadas(aprobadas);      
        

//        response.setSolicitudesAprobadasMesActual(
//                aprobadas.getAprobadasMesActual()
//        );
//
//
//        response.setSolicitudesAprobadasMesAnterior(
//                aprobadas.getAprobadasMesAnterior()
//        );
//
//
//        response.setMontoAprobadoMesActual(
//                aprobadas.getMontoMesActual()
//        );
//
//
//        response.setMontoAprobadoMesAnterior(
//                aprobadas.getMontoMesAnterior()
//        );
//
//
//
//        response.setPorcentajeSolicitudesAprobadas(
//                calcularPorcentaje(
//                    aprobadas.getAprobadasMesActual(),
//                    aprobadas.getAprobadasMesAnterior()
//                )
//        );
//
//
//        response.setPorcentajeMontoAprobado(
//                calcularPorcentajeMonto(
//                    aprobadas.getMontoMesActual(),
//                    aprobadas.getMontoMesAnterior()
//                )
//        );



        // ==========================
        // GRÁFICO EVOLUCIÓN
        // ==========================


      List<ClienteSolicitudesMensualesProjection> evolucionProjection =
        historialRepo.obtenerEvolucionSolicitudes(
                idUsuario,
                inicioSeisMeses
        );


// ==========================
// COMPLETAR MESES SIN SOLICITUDES
// ==========================

Map<String, Long> solicitudesPorMes =
        evolucionProjection.stream()
                .collect(Collectors.toMap(
                        ClienteSolicitudesMensualesProjection::getMes,
                        ClienteSolicitudesMensualesProjection::getCantidadSolicitudes
                ));


List<ClienteSolicitudesMensualesResponse> evolucion =
        new ArrayList<>();


YearMonth primerMes =
        YearMonth.from(inicioSeisMeses);


for (int i = 0; i < 6; i++) {

    String mes =
            primerMes.plusMonths(i)
                     .toString();


    evolucion.add(
            new ClienteSolicitudesMensualesResponse(
                    mes,
                    solicitudesPorMes.getOrDefault(mes, 0L)
            )
    );
}


response.setGraficoEvolucionSolicitudes(evolucion);  
        
        
        
        
        
//        response.setGraficoEvolucionSolicitudes(
//                historialRepo.obtenerEvolucionSolicitudes(
//                        idUsuario,
//                        inicioSeisMeses
//                )
//        );



        // ==========================
        // GRÁFICO ESTADOS
        // ==========================


        response.setGraficoEstadosSolicitudes(
                solicitudRepo.obtenerEstadosSolicitudesCliente(
                        idUsuario
                )
        );



        // ==========================
        // PRODUCTOS MÁS SOLICITADOS
        // ==========================


        response.setGraficoProductosSolicitados(
                historialRepo.obtenerProductosMasSolicitados(
                        idUsuario, inicioSeisMeses
                ).stream()
    .limit(5)
    .toList()
        );



        // ==========================
        // MONTO APROBADO POR MES
        // ==========================


      List<ClienteMontoAprobadoMensualProjection> montoProjection =
        historialRepo.obtenerMontoAprobadoPorMes(
                idUsuario,
                inicioSeisMeses
        );


// ==========================
// COMPLETAR MESES SIN MONTO APROBADO
// ==========================

Map<String, BigDecimal> montoPorMes =
        montoProjection.stream()
                .collect(Collectors.toMap(
                        ClienteMontoAprobadoMensualProjection::getMes,
                        ClienteMontoAprobadoMensualProjection::getMontoAprobado
                ));


List<ClienteMontoAprobadoMensualResponse> montos =
        new ArrayList<>();


YearMonth primerMesMonto =
        YearMonth.from(inicioSeisMeses);


for (int i = 0; i < 6; i++) {

    String mes =
            primerMesMonto.plusMonths(i)
                     .toString();


    montos.add(
            new ClienteMontoAprobadoMensualResponse(
                    mes,
                    montoPorMes.getOrDefault(
                            mes,
                            BigDecimal.ZERO
                    )
            )
    );
}


  



        response.setGraficoMontoAprobado(
                montos
        );



        return response;  
    
    
    
    
    
}



private Double calcularPorcentaje(Long actual, Long anterior) {

    if (anterior == null || anterior == 0) {
        return 0.0;
    }

    return ((actual.doubleValue() - anterior.doubleValue())
            / anterior.doubleValue()) * 100;
}


private Double calcularPorcentajeMonto(
        BigDecimal actual,
        BigDecimal anterior
) {

    if (anterior == null || anterior.compareTo(BigDecimal.ZERO) == 0) {
        return 0.0;
    }

    return actual.subtract(anterior)
            .divide(anterior, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .doubleValue();
}







}
