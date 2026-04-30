/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.integration;

import com.nethink.b2b.service.ConfigService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


@Service
public class ComentarioService {

    @Autowired
    private ConfigService configService;

    private final RestTemplate restTemplate = new RestTemplate();

    public String analizar(String texto) {

        String url = configService.getValor("AI_COMMENTS_URL");

        Map<String, String> body = new HashMap<>();
        body.put("text", texto);

        return restTemplate.postForObject(url, body, String.class);
    }
}