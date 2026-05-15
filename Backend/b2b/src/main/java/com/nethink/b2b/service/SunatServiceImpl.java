package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.SunatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class SunatServiceImpl implements SunatService {

    private final RestTemplate restTemplate;
    @Autowired
    private  ConfigService configService;

  
    

    public SunatServiceImpl(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public SunatResponse consultarRuc(String ruc) {
        
        String apiKey = configService.getValor("DECOLECTA_API_TOKEN");

        String url = "https://api.decolecta.com/v1/sunat/ruc?numero=" + ruc;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                Map.class
        );

        Map body = response.getBody();

        SunatResponse dto = new SunatResponse();

        dto.setRuc((String) body.get("numero_documento"));
        dto.setRazonSocial((String) body.get("razon_social"));
        dto.setDireccion((String) body.get("direccion"));
        dto.setEstado((String) body.get("estado"));
        dto.setCondicion((String) body.get("condicion"));

        return dto;
    }
}