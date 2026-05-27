package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.RFQRequest;
import com.nethink.b2b.dto.response.RFQProveedorResponse;
import com.nethink.b2b.entity.enums.PrioridadRFQ;
import com.nethink.b2b.repository.ComentarioRepository;
import com.nethink.b2b.repository.EvaluacionRepository;
import com.nethink.b2b.repository.ReclamoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScoringService {

    private final EvaluacionRepository evaluacionRepo;
    private final ReclamoRepository reclamoRepo;
    private final ComentarioRepository comentarioRepo;

    public ScoringService(EvaluacionRepository evaluacionRepo,
                          ReclamoRepository reclamoRepo,
                          ComentarioRepository comentarioRepo) {
        this.evaluacionRepo = evaluacionRepo;
        this.reclamoRepo = reclamoRepo;
        this.comentarioRepo = comentarioRepo;
    }

    public void calcularScore(List<RFQProveedorResponse> proveedores,
                              PrioridadRFQ prioridad) {

        if (proveedores == null || proveedores.isEmpty()) return;

        double wPrecio = 0.4;
        double wTiempo = 0.3;
        double wCalidad = 0.3;

        if (prioridad == null) {
            prioridad = PrioridadRFQ.BALANCEADO;
        }

        if (prioridad == PrioridadRFQ.PRECIO) {
            wPrecio = 0.6;
            wTiempo = 0.2;
            wCalidad = 0.2;
        }

        if (prioridad == PrioridadRFQ.TIEMPO) {
            wPrecio = 0.2;
            wTiempo = 0.6;
            wCalidad = 0.2;
        }

        if (prioridad == PrioridadRFQ.CALIDAD) {
            wPrecio = 0.2;
            wTiempo = 0.2;
            wCalidad = 0.6;
        }

        double mejorPrecio = proveedores.stream()
                .mapToDouble(p -> p.getTotalCotizacion() != null ? p.getTotalCotizacion() : Double.MAX_VALUE)
                .min()
                .orElse(1);

        double mejorTiempo = proveedores.stream()
                .mapToInt(p -> p.getTiempoEntregaPromedio() != null ? p.getTiempoEntregaPromedio() : Integer.MAX_VALUE)
                .min()
                .orElse(1);

        for (RFQProveedorResponse p : proveedores) {

            double precio = p.getTotalCotizacion() != null ? p.getTotalCotizacion() : Double.MAX_VALUE;
            double tiempo = p.getTiempoEntregaPromedio() != null ? p.getTiempoEntregaPromedio() : Integer.MAX_VALUE;

            double scorePrecio = mejorPrecio / precio;
            double scoreTiempo = mejorTiempo / tiempo;
            double scoreCalidad = calcularCalidad(p.getIdProveedor());

            double scoreFinal =
                    (wPrecio * scorePrecio) +
                    (wTiempo * scoreTiempo) +
                    (wCalidad * scoreCalidad);

            p.setScoreFinal(scoreFinal);
        }
    }

    private double calcularCalidad(Integer idProveedor) {

        if (idProveedor == null) return 3.0;

        Double evaluacion = evaluacionRepo.promedioCalidad(idProveedor);

        Integer negativos = comentarioRepo.contarComentariosNegativos(idProveedor);
        Integer positivos = comentarioRepo.contarComentariosPositivos(idProveedor);

        Integer reclamos = reclamoRepo.contarReclamos(idProveedor);

        double base = evaluacion != null ? evaluacion : 3.5;

        int pos = positivos != null ? positivos : 0;
        int neg = negativos != null ? negativos : 0;
        int rec = reclamos != null ? reclamos : 0;

        double impactoComentarios = (pos * 0.1) - (neg * 0.2);
        double impactoReclamos = rec * 0.3;

        double calidadFinal = base + impactoComentarios - impactoReclamos;

        if (calidadFinal < 1) return 1;
        if (calidadFinal > 5) return 5;

        return calidadFinal;
    }
    
    public double calcularScoreProveedorBasico(Integer idProveedor) {

    double calidad = calcularCalidad(idProveedor);

    // fallback si no tienes RFQ contexto
    double precio = 1.0;
    double tiempo = 1.0;

    double wPrecio = 0.4;
    double wTiempo = 0.3;
    double wCalidad = 0.3;

    return (wPrecio * precio) +
           (wTiempo * tiempo) +
           (wCalidad * (calidad / 5.0));
}
}