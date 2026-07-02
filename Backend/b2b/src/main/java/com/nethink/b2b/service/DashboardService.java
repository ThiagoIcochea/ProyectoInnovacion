/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.service;

import org.springframework.stereotype.Service;


import com.nethink.b2b.repository.SolicitudRepository;
import com.nethink.b2b.repository.SolicitudHistorialRepository; 
import com.nethink.b2b.dto.response.ProveedorDashboardResponse;
import com.nethink.b2b.dto.response.ProductoMasVendidoResponse;
import com.nethink.b2b.repository.DetalleSolicitudRepository; 

import com.nethink.b2b.repository.PagoRepository;
import com.nethink.b2b.dto.response.IngresoMensualResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;






import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map; 











/**
 *
 * @author USUARIO
 */


   @Service
public class DashboardService {

    
   private final SolicitudHistorialRepository historialRepo                   ;
   private final SolicitudRepository solicitudRepo               ;
   private final PagoRepository pagoRepository                ;
   private final DetalleSolicitudRepository detalleSolicitudRepository;  
   

    public DashboardService(SolicitudHistorialRepository historialRepo,SolicitudRepository solicitudRepo, PagoRepository pagoRepository, DetalleSolicitudRepository detalleSolicitudRepository   ) {
        this.historialRepo = historialRepo;
        this.solicitudRepo = solicitudRepo;
        this.pagoRepository= pagoRepository         ; 
        this.detalleSolicitudRepository=detalleSolicitudRepository; 
    }

    public ProveedorDashboardResponse obtenerDashboard(Integer idProveedor) {

        // =========================
        // FECHAS
        // =========================

        LocalDate hoy = LocalDate.now();

        LocalDateTime inicioMesActual =
                hoy.withDayOfMonth(1).atStartOfDay();

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

        // =========================
        // CONSULTAS
        // =========================

        Long solicitudesMesActual =
                historialRepo.contarSolicitudesMesActual(
                        idProveedor, 
                        inicioMesActual,
                        finMesActual
                );

        Long solicitudesMesAnterior =
                historialRepo.contarSolicitudesMesAnterior(
                        idProveedor, 
                        inicioMesAnterior,
                        finMesAnterior
                );

        // =========================
        // VALIDACIÓN NULL
        // =========================

        if (solicitudesMesActual == null) {
            solicitudesMesActual = 0L;
        }

        if (solicitudesMesAnterior == null) {
            solicitudesMesAnterior = 0L;
        }

        // =========================
        // PORCENTAJE
        // =========================

        Double porcentajeSolicitudes=calcularPorcentaje(
                        solicitudesMesActual,
                        solicitudesMesAnterior);

        

        // =========================
        // RESPONSE
        // =========================

        
        
       
       
    // indicador de ingresos   
       
       
     Object[] ingresos =
        solicitudRepo.obtenerIngresosDashboard(
                idProveedor, 
                inicioMesActual,
                finMesActual,
                inicioMesAnterior,
                finMesAnterior
        );

BigDecimal ingresosMesActual =
        ingresos[0] == null
        ? BigDecimal.ZERO
        : (BigDecimal) ingresos[0];

BigDecimal ingresosMesAnterior =
        ingresos[1] == null
        ? BigDecimal.ZERO
        : (BigDecimal) ingresos[1];
    
    
 Double porcentajeIngresos=calcularPorcentaje(
                        ingresosMesActual,
                        ingresosMesAnterior);





// indicador de solicitudes aprobadas mensual


Object[] resultado =
        historialRepo.obtenerSolicitudesAprobadasDashboard(
                idProveedor, 
                inicioMesActual,
                finMesActual,
                inicioMesAnterior,
                finMesAnterior
        );

Long solicitudesAprobadasMesActual =
        resultado[0] == null
        ? 0L
        : ((Number) resultado[0]).longValue();

Long solicitudesAprobadasMesAnterior =
        resultado[1] == null
        ? 0L
        : ((Number) resultado[1]).longValue();



Double porcentajeSolicitudesAprobadas= calcularPorcentaje(
                        solicitudesAprobadasMesActual,
                        solicitudesAprobadasMesAnterior);



// ingresos en lista para los graficos

LocalDateTime fechaInicioGrafico =
                inicioMesActual.minusMonths(11);

        LocalDateTime fechaFinGrafico =
                finMesActual;


List<IngresoMensualResponse> graficoIngresos =
                obtenerGraficoIngresos(
                        idProveedor, 
                        fechaInicioGrafico,
                        fechaFinGrafico);
        
        
        
 // productos mas vendidos en el mes       

List<ProductoMasVendidoResponse> productosMasVendidos =
        obtenerProductosMasVendidos(
                idProveedor,
                inicioMesActual,
                finMesActual
        );







ProveedorDashboardResponse response =
        new ProveedorDashboardResponse();

response.setSolicitudesMesActual(solicitudesMesActual);
response.setSolicitudesMesAnterior(solicitudesMesAnterior);
response.setPorcentajeSolicitudes(porcentajeSolicitudes);

response.setIngresosMesActual(ingresosMesActual);
response.setIngresosMesAnterior(ingresosMesAnterior);
response.setPorcentajeIngresos(porcentajeIngresos);

response.setSolicitudesAprobadasMesActual(
                solicitudesAprobadasMesActual);

        response.setSolicitudesAprobadasMesAnterior(
                solicitudesAprobadasMesAnterior);

        response.setPorcentajeSolicitudesAprobadas(
                porcentajeSolicitudesAprobadas);

response.setGraficoIngresos(
        graficoIngresos);
response.setProductosMasVendidos(productosMasVendidos);





return response          ;

    
}
  

   
private Double calcularPorcentaje(
            Long actual,
            Long anterior) {

        if (anterior == 0) {
            return actual > 0 ? 100.0 : 0.0;
        }

        return ((actual - anterior) * 100.0) / anterior;
    }




    private Double calcularPorcentaje(
            BigDecimal actual,
            BigDecimal anterior) {

        if (anterior.compareTo(BigDecimal.ZERO) == 0) {
            return actual.compareTo(BigDecimal.ZERO) > 0
                    ? 100.0
                    : 0.0;
        }

        return actual
                .subtract(anterior)
                .multiply(BigDecimal.valueOf(100))
                .divide(anterior, 2, RoundingMode.HALF_UP)
                .doubleValue();
    }


    private List<IngresoMensualResponse> obtenerGraficoIngresos(Integer idProveedor, LocalDateTime fechaInicio, LocalDateTime fechaFin) {

    

    List<Object[]> datos =
            pagoRepository.obtenerIngresosUltimos12Meses(
                    idProveedor, 
                    fechaInicio,
                    fechaFin
            );

    Map<YearMonth, BigDecimal> mapaIngresos =
            new HashMap<>();

    for (Object[] fila : datos) {

        Integer anio =
                ((Number) fila[0]).intValue();

        Integer mes =
                ((Number) fila[1]).intValue();

        BigDecimal ingreso =
                (BigDecimal) fila[2];

        mapaIngresos.put(
                YearMonth.of(anio, mes),
                ingreso
        );
    }

    List<IngresoMensualResponse> grafico =
            new ArrayList<>();

    YearMonth inicio =
            YearMonth.from(fechaInicio);

    for (int i = 0; i < 12; i++) {

        YearMonth mesActual =
                inicio.plusMonths(i);

        BigDecimal ingreso =
                mapaIngresos.getOrDefault(
                        mesActual,
                        BigDecimal.ZERO
                );

        String nombreMes =
                mesActual.getMonth()
                        .getDisplayName(
                                TextStyle.SHORT,
                                new Locale("es", "ES")
                        );

        grafico.add(

                new IngresoMensualResponse(

                        nombreMes + " " + mesActual.getYear(),

                        ingreso

                )
        );
    }

    return grafico;
}
    
    
    
 // funcion servicio de productos mas vendidos
    
   private List<ProductoMasVendidoResponse> obtenerProductosMasVendidos(
        Integer idProveedor,
        LocalDateTime inicioMesActual,
        LocalDateTime finMesActual
) {

    List<Object[]> datos =
            detalleSolicitudRepository.obtenerProductosMasVendidosMesActual(
                    idProveedor,
                    inicioMesActual,
                    finMesActual,
                    PageRequest.of(0, 5)
            );

    List<ProductoMasVendidoResponse> productos = new ArrayList<>();

    for (Object[] fila : datos) {

        String nombre = (String) fila[0];

        Long cantidad = ((Number) fila[1]).longValue();

        productos.add(
                new ProductoMasVendidoResponse(nombre, cantidad)
        );
    }

    return productos;
} 
    
    
    
    
    
    
    
    
    
    
    
    
    
   }


    
    
    
    
    
    
    

