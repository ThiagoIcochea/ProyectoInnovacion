/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.service;


import com.nethink.b2b.dto.response.IAComentarioResponse;
import com.nethink.b2b.entity.Configuracion;
import com.nethink.b2b.repository.ConfiguracionRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.nethink.b2b.dto.request.GroqMessage;
import com.nethink.b2b.dto.request.GroqRequest;
import java.util.List;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;


@Service
public class ModeracionService {

    private final ConfiguracionRepository configRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ModeracionService(ConfiguracionRepository configRepository) {
        this.configRepository = configRepository;
    }

   public IAComentarioResponse moderar(String texto) {

        Configuracion config = configRepository
                .findByClave("AI_COMMENTS")
                .orElseThrow();

        String apiKey = config.getValor();

        String prompt = """
            Eres un sistema de moderación de comentarios.

            Analiza el comentario y responde únicamente JSON válido.

            {
              "tipo":"NORMAL|SPAM|OFENSIVO|PROMOCIONAL",
              "estado":"OK|BLOQUEADO",
              "sentimiento":"POSITIVO|NEGATIVO|NEUTRO"
            }

            Comentario:
            """ + texto;

        GroqMessage system = new GroqMessage();
        system.setRole("system");
        system.setContent(prompt);

        GroqRequest requestBody = new GroqRequest();
        requestBody.setModel("openai/gpt-oss-20b");
        requestBody.setTemperature(0.1);
        requestBody.setMessages(List.of(system));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<GroqRequest> entity =
                new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response =
                restTemplate.exchange(
                        "https://api.groq.com/openai/v1/chat/completions",
                        HttpMethod.POST,
                        entity,
                        String.class
                );

        try {

            JsonNode root =
                    objectMapper.readTree(response.getBody());

            String content =
                    root.path("choices")
                        .get(0)
                        .path("message")
                        .path("content")
                        .asText();

            return objectMapper.readValue(
                    content,
                    IAComentarioResponse.class
            );

        } catch (Exception e) {
            throw new RuntimeException(
                    "Error procesando respuesta de Groq",
                    e
            );
        }
    }
}