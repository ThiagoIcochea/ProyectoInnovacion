/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.ConfiguracionResponse;
import com.nethink.b2b.entity.Configuracion;
import com.nethink.b2b.repository.ConfiguracionRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


@Service
public class ConfigService {

    @Autowired
    private ConfiguracionRepository repo;

    public String getValor(String clave) {
        return repo.findByClave(clave)
                .map(Configuracion::getValor)
                .orElse(null);
    }

    public void actualizar(String clave, String valor) {
        Configuracion config = repo.findByClave(clave)
                .orElse(new Configuracion());

        config.setClave(clave);
        config.setValor(valor);

        repo.save(config);
    }
    
    public List<ConfiguracionResponse> listar() {

    return repo.findAll()
            .stream()
            .map(config -> {

                boolean testeable =
                        config.getTipo().equals("API")
                        || config.getTipo().equals("URL")
                        || config.getTipo().equals("IA")
                        || config.getTipo().equals("API_REST")
                        || config.getTipo().equals("API_IA");

                return new ConfiguracionResponse(
                        config.getId(),
                        config.getClave(),
                        config.getValor(),
                        testeable,
                        "ACTIVO",
                        config.getTipo()
                );
            })
            .toList();
}
    
    public void actualizarValor(
        Integer id,
        String valor
) {

    Configuracion config =
            repo.findById(id)
            .orElseThrow();

    config.setValor(valor);

    repo.save(config);
}
    
   public String probarConexion(Integer id) {

    Configuracion config =
            repo.findById(id)
            .orElseThrow();

    String tipo = config.getTipo();
    String valor = config.getValor();

    try {

        org.springframework.web.client.RestTemplate rest =
                new org.springframework.web.client.RestTemplate();

        org.springframework.http.ResponseEntity<String> response;

        if (
            tipo.equals("API")
            || tipo.equals("IA")
            || tipo.equals("API_REST")
            || tipo.equals("API_IA")
        ) {

            response = rest.getForEntity(
                    valor,
                    String.class
            );

        } else if (
            tipo.equals("URL")
        ) {

            response = rest.getForEntity(
                    valor,
                    String.class
            );

        } else {

            config.setEstado("INACTIVO");

            repo.save(config);

            return "NO_TESTEABLE";
        }

        int status =
                response.getStatusCode().value();

        if (status >= 200 && status < 400) {

            config.setEstado("ACTIVO");

            repo.save(config);

            return "OK";
        }

        config.setEstado("INACTIVO");

        repo.save(config);

        return "ERROR";

    } catch (Exception e) {

        config.setEstado("INACTIVO");

        repo.save(config);

        return "ERROR";
    }
}
}
