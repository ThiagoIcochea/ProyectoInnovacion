package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.RFQProveedorResponse;
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

    public void calcularScore(List<RFQProveedorResponse> proveedores) {

        double mejorPrecio = proveedores.stream()
                .mapToDouble(RFQProveedorResponse::getTotalCotizacion)
                .min()
                .orElse(1);

        double mejorTiempo = proveedores.stream()
                .mapToInt(RFQProveedorResponse::getTiempoEntregaPromedio)
                .min()
                .orElse(1);

        for (RFQProveedorResponse p : proveedores) {

            double scorePrecio = mejorPrecio / p.getTotalCotizacion();
            double scoreTiempo = (double) mejorTiempo / p.getTiempoEntregaPromedio();
            double scoreCalidad = calcularCalidad(p.getIdProveedor());

            double scoreFinal =
                    (0.4 * scorePrecio) +
                    (0.3 * scoreTiempo) +
                    (0.3 * scoreCalidad);

            p.setScoreFinal(scoreFinal);
        }
    }

    // 🔴 CALIDAD REAL (EVALUACIONES + COMENTARIOS + RECLAMOS)
    private double calcularCalidad(Integer idProveedor) {

        Double evaluacion = evaluacionRepo.promedioCalidad(idProveedor);

        Integer negativos = comentarioRepo.contarComentariosNegativos(idProveedor);
        Integer positivos = comentarioRepo.contarComentariosPositivos(idProveedor);

        Integer reclamos = reclamoRepo.contarReclamos(idProveedor);

        double base = (evaluacion != null) ? evaluacion : 3.5;

        // comentarios influyen directamente
        double impactoComentarios = (positivos * 0.1) - (negativos * 0.2);

        // reclamos penalizan más fuerte
        double impactoReclamos = reclamos * 0.3;

        double calidadFinal = base + impactoComentarios - impactoReclamos;

        if (calidadFinal < 1) return 1;

        return Math.min(calidadFinal, 5);
    }
}