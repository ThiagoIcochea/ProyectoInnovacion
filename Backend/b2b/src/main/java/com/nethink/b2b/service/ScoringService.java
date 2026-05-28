package com.nethink.b2b.service;

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

    public ScoringService(
            EvaluacionRepository evaluacionRepo,
            ReclamoRepository reclamoRepo,
            ComentarioRepository comentarioRepo,
            ProveedorProductoRepository proveedorProductoRepo
    ) {

        this.evaluacionRepo = evaluacionRepo;
        this.reclamoRepo = reclamoRepo;
        this.comentarioRepo = comentarioRepo;
        this.proveedorProductoRepo = proveedorProductoRepo;
    }

    /*
        ==========================================
        RFQ SCORING DINAMICO
        ==========================================
    */

    public void calcularScore(
            List<RFQProveedorResponse> proveedores,
            PrioridadRFQ prioridad
    ) {

        if (proveedores == null || proveedores.isEmpty()) {
            return;
        }

        if (prioridad == null) {
            prioridad = PrioridadRFQ.BALANCEADO;
        }

        double wPrecio = 0.40;
        double wTiempo = 0.30;
        double wCalidad = 0.30;

        switch (prioridad) {

            case PRECIO:

                wPrecio = 0.60;
                wTiempo = 0.20;
                wCalidad = 0.20;

                break;

            case TIEMPO:

                wPrecio = 0.20;
                wTiempo = 0.60;
                wCalidad = 0.20;

                break;

            case CALIDAD:

                wPrecio = 0.20;
                wTiempo = 0.20;
                wCalidad = 0.60;

                break;

            case BALANCEADO:
            default:
                break;
        }

        double mejorPrecio = proveedores.stream()
                .mapToDouble(p ->
                        p.getTotalCotizacion() != null
                                ? p.getTotalCotizacion()
                                : Double.MAX_VALUE
                )
                .min()
                .orElse(1);

        int mejorTiempo = proveedores.stream()
                .mapToInt(p ->
                        p.getTiempoEntregaPromedio() != null
                                ? p.getTiempoEntregaPromedio()
                                : Integer.MAX_VALUE
                )
                .min()
                .orElse(1);

        for (RFQProveedorResponse proveedor : proveedores) {

            double precio = proveedor.getTotalCotizacion() != null
                    ? proveedor.getTotalCotizacion()
                    : Double.MAX_VALUE;

            int tiempo = proveedor.getTiempoEntregaPromedio() != null
                    ? proveedor.getTiempoEntregaPromedio()
                    : Integer.MAX_VALUE;

            /*
                SCORE PRECIO
                Menor precio = mejor score
            */

            double scorePrecio;

            if (precio <= 0 || precio == Double.MAX_VALUE) {

                scorePrecio = 0;

            } else {

                scorePrecio =
                        mejorPrecio / precio;

                scorePrecio =
                        limitar(scorePrecio, 0, 1);
            }

            /*
                SCORE TIEMPO
                Menor tiempo = mejor score
            */

            double scoreTiempo;

            if (tiempo <= 0 || tiempo == Integer.MAX_VALUE) {

                scoreTiempo = 0;

            } else {

                scoreTiempo =
                        (double) mejorTiempo / tiempo;

                scoreTiempo =
                        limitar(scoreTiempo, 0, 1);
            }

            /*
                SCORE CALIDAD
                NORMALIZADO 0 - 1
            */

            double scoreCalidad =
                    calcularCalidad(proveedor.getIdProveedor()) / 5.0;

            /*
                SCORE FINAL
            */

            double scoreFinal =
                    (scorePrecio * wPrecio) +
                    (scoreTiempo * wTiempo) +
                    (scoreCalidad * wCalidad);

            /*
                AJUSTE POR RECLAMOS
            */

            Integer reclamos =
                    reclamoRepo.contarReclamos(
                            proveedor.getIdProveedor()
                    );

            int totalReclamos =
                    reclamos != null ? reclamos : 0;

            if (totalReclamos >= 10) {

                scoreFinal -= 0.25;

            } else if (totalReclamos >= 5) {

                scoreFinal -= 0.15;

            } else if (totalReclamos >= 3) {

                scoreFinal -= 0.10;
            }

            /*
                AJUSTE POR POCA DATA
            */

            Integer positivos =
                    comentarioRepo.contarComentariosPositivos(
                            proveedor.getIdProveedor()
                    );

            Integer negativos =
                    comentarioRepo.contarComentariosNegativos(
                            proveedor.getIdProveedor()
                    );

            int totalComentarios =
                    (positivos != null ? positivos : 0) +
                    (negativos != null ? negativos : 0);

            if (totalComentarios == 0) {

                scoreFinal *= 0.90;
            }

            /*
                LIMITES
            */

            scoreFinal =
                    limitar(scoreFinal, 0, 1);

            proveedor.setScoreFinal(scoreFinal);
        }
    }

    /*
        ==========================================
        CALIDAD GLOBAL
        ==========================================
    */

    private double calcularCalidad(Integer idProveedor) {

        if (idProveedor == null) {
            return 3.0;
        }

        /*
            EVALUACION PROMEDIO
            ESCALA 1 - 5
        */

        Double evaluacion =
                evaluacionRepo.promedioCalidad(idProveedor);

        double base =
                evaluacion != null
                        ? evaluacion
                        : 3.5;

        /*
            COMENTARIOS
        */

        Integer positivos =
                comentarioRepo.contarComentariosPositivos(idProveedor);

        Integer negativos =
                comentarioRepo.contarComentariosNegativos(idProveedor);

        int pos = positivos != null ? positivos : 0;
        int neg = negativos != null ? negativos : 0;

        int totalComentarios = pos + neg;

        /*
            REPUTACION
            0 -> 1
        */

        double reputacion;

        if (totalComentarios == 0) {

            reputacion = 0.5;

        } else {

            reputacion =
                    (double) pos / totalComentarios;
        }

        /*
            IMPACTO COMENTARIOS
            ENTRE -1 Y +1
        */

        double impactoComentarios =
                (reputacion - 0.5) * 2;

        /*
            RECLAMOS
        */

        Integer reclamos =
                reclamoRepo.contarReclamos(idProveedor);

        int totalReclamos =
                reclamos != null ? reclamos : 0;

        double penalizacionReclamos =
                totalReclamos * 0.15;

        /*
            CALIDAD FINAL
        */

        double calidadFinal =
                base +
                impactoComentarios -
                penalizacionReclamos;

        /*
            LIMITES
        */

        calidadFinal =
                limitar(calidadFinal, 1, 5);

        return calidadFinal;
    }

    /*
        ==========================================
        SCORE BASICO GLOBAL
        ==========================================
    */

    public double calcularScoreProveedorBasico(
            Integer idProveedor
    ) {

        if (idProveedor == null) {
            return 0;
        }

        Double promedioPrecio =
                proveedorProductoRepo
                        .promedioPrecioProveedor(idProveedor);

        Double promedioTiempo =
                proveedorProductoRepo
                        .promedioTiempoEntregaProveedor(idProveedor);

        double calidad =
                calcularCalidad(idProveedor);

        /*
            SCORE PRECIO
        */

        double scorePrecio;

        if (promedioPrecio == null || promedioPrecio <= 0) {

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
        */

        double scoreCalidad =
                calidad / 5.0;

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
            RECLAMOS
        */

        Integer reclamos =
                reclamoRepo.contarReclamos(idProveedor);

        int totalReclamos =
                reclamos != null ? reclamos : 0;

        if (totalReclamos >= 10) {

            scoreFinal -= 0.25;

        } else if (totalReclamos >= 5) {

            scoreFinal -= 0.15;

        } else if (totalReclamos >= 3) {

            scoreFinal -= 0.10;
        }

        /*
            SIN DATA
        */

        boolean sinProductos =
                promedioPrecio == null &&
                promedioTiempo == null;

        Integer positivos =
                comentarioRepo.contarComentariosPositivos(idProveedor);

        Integer negativos =
                comentarioRepo.contarComentariosNegativos(idProveedor);

        int totalComentarios =
                (positivos != null ? positivos : 0) +
                (negativos != null ? negativos : 0);

        if (sinProductos && totalComentarios == 0) {

            scoreFinal *= 0.5;
        }

        /*
            LIMITES
        */

        scoreFinal =
                limitar(scoreFinal, 0, 1);

        return scoreFinal;
    }

    /*
        ==========================================
        UTIL
        ==========================================
    */

    private double limitar(
            double valor,
            double min,
            double max
    ) {

        if (valor < min) {
            return min;
        }

        if (valor > max) {
            return max;
        }

        return valor;
    }
}