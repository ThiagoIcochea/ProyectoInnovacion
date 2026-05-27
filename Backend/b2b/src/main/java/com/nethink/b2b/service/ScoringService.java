package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.RFQRequest;
import com.nethink.b2b.dto.response.RFQProveedorResponse;
import com.nethink.b2b.entity.enums.PrioridadRFQ;
import com.nethink.b2b.repository.ComentarioRepository;
import com.nethink.b2b.repository.EvaluacionRepository;
import com.nethink.b2b.repository.ProveedorProductoRepository;
import com.nethink.b2b.repository.ReclamoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScoringService {

    private final EvaluacionRepository evaluacionRepo;
    private final ReclamoRepository reclamoRepo;
    private final ComentarioRepository comentarioRepo;
   private final ProveedorProductoRepository proveedorProductoRepo;
    public ScoringService(EvaluacionRepository evaluacionRepo,
                          ReclamoRepository reclamoRepo,
                          ComentarioRepository comentarioRepo,
                          ProveedorProductoRepository proveedorProductoRepo) {
        this.evaluacionRepo = evaluacionRepo;
        this.reclamoRepo = reclamoRepo;
        this.comentarioRepo = comentarioRepo;
        this.proveedorProductoRepo=proveedorProductoRepo;
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

    if (idProveedor == null) {
        return 0;
    }

    Double promedioPrecio = proveedorProductoRepo.promedioPrecioProveedor(idProveedor);
    Double promedioTiempo = proveedorProductoRepo.promedioTiempoEntregaProveedor(idProveedor);

    double calidad = calcularCalidad(idProveedor);

    /*
        SCORE PRECIO
        Mientras menor precio promedio tenga el proveedor,
        mejor score obtiene.
    */

    double scorePrecio;

    if (promedioPrecio == null || promedioPrecio <= 0) {

        // proveedor sin productos
        scorePrecio = 0.2;

    } else if (promedioPrecio <= 100) {

        scorePrecio = 1.0;

    } else if (promedioPrecio <= 500) {

        scorePrecio = 0.9;

    } else if (promedioPrecio <= 1000) {

        scorePrecio = 0.8;

    } else if (promedioPrecio <= 3000) {

        scorePrecio = 0.6;

    } else {

        scorePrecio = 0.4;
    }

    /*
        SCORE TIEMPO
        Mientras menor tiempo entrega tenga,
        mejor score obtiene.
    */

    double scoreTiempo;

    if (promedioTiempo == null || promedioTiempo <= 0) {

        scoreTiempo = 0.2;

    } else if (promedioTiempo <= 1) {

        scoreTiempo = 1.0;

    } else if (promedioTiempo <= 3) {

        scoreTiempo = 0.9;

    } else if (promedioTiempo <= 5) {

        scoreTiempo = 0.8;

    } else if (promedioTiempo <= 10) {

        scoreTiempo = 0.6;

    } else {

        scoreTiempo = 0.4;
    }

    /*
        SCORE CALIDAD
        calidad viene de:
        - evaluaciones
        - comentarios positivos
        - comentarios negativos
        - reclamos
    */

    double scoreCalidad = calidad / 5.0;

    /*
        PESOS
    */

    double wPrecio = 0.35;
    double wTiempo = 0.25;
    double wCalidad = 0.40;

    double scoreFinal =
            (scorePrecio * wPrecio) +
            (scoreTiempo * wTiempo) +
            (scoreCalidad * wCalidad);

    /*
        PENALIZACION POR RECLAMOS
    */

    Integer reclamos = reclamoRepo.contarReclamos(idProveedor);

    int totalReclamos = reclamos != null ? reclamos : 0;

    if (totalReclamos >= 3) {
        scoreFinal -= 0.10;
    }

    if (totalReclamos >= 5) {
        scoreFinal -= 0.15;
    }

    if (totalReclamos >= 10) {
        scoreFinal -= 0.25;
    }

    /*
        PENALIZACION SI NO TIENE DATA
    */

    boolean sinProductos =
            promedioPrecio == null &&
            promedioTiempo == null;

    Integer positivos = comentarioRepo.contarComentariosPositivos(idProveedor);
    Integer negativos = comentarioRepo.contarComentariosNegativos(idProveedor);

    int totalComentarios =
            (positivos != null ? positivos : 0) +
            (negativos != null ? negativos : 0);

    if (sinProductos && totalComentarios == 0) {

        scoreFinal *= 0.5;
    }

    /*
        LIMITES
    */

    if (scoreFinal < 0) {
        scoreFinal = 0;
    }

    if (scoreFinal > 1) {
        scoreFinal = 1;
    }

    return scoreFinal;
}
}