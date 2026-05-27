/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.IAComentarioRequest;
import com.nethink.b2b.dto.response.IAComentarioResponse;
import com.nethink.b2b.entity.Configuracion;
import com.nethink.b2b.repository.ConfiguracionRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


@Service
public class ModeracionService {

    private final ConfiguracionRepository configRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    public ModeracionService(ConfiguracionRepository configRepository) {
        this.configRepository = configRepository;
    }

    public IAComentarioResponse moderar(String texto) {

        Configuracion config = configRepository.findByClave("AI_COMMENTS_URL").orElseThrow();
    
        String url = config.getValor();

        IAComentarioRequest req = new IAComentarioRequest();
        req.setTexto(texto);
        req.setModo("comentario");

        return restTemplate.postForObject(url, req, IAComentarioResponse.class);
    }
}