package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.RFQRequest;
import com.nethink.b2b.dto.response.RFQProveedorResponse;
import com.nethink.b2b.service.MatchingService;
import com.nethink.b2b.service.PricingService;
import com.nethink.b2b.service.ScoringService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RFQService {

    private final MatchingService matchingService;
    private final PricingService pricingService;
    private final ScoringService scoringService;

    public RFQService(MatchingService matchingService,
                      PricingService pricingService,
                      ScoringService scoringService) {
        this.matchingService = matchingService;
        this.pricingService = pricingService;
        this.scoringService = scoringService;
    }

    public List<RFQProveedorResponse> generarCotizacion(RFQRequest request) {

        
        List<Integer> proveedoresValidos =
                matchingService.encontrarProveedores(request);

        
        List<RFQProveedorResponse> cotizaciones =
                pricingService.calcularCotizaciones(request, proveedoresValidos);

      
        scoringService.calcularScore(cotizaciones);

       
        return cotizaciones.stream()
                .sorted((a, b) -> Double.compare(b.getScoreFinal(), a.getScoreFinal()))
                .limit(10)
                .toList();
    }
}