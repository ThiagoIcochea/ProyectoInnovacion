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

    public void crear(String clave, String valor, String tipo, String estado) {
        if (clave == null || clave.isBlank()) {
            throw new RuntimeException("La clave de configuración es obligatoria");
        }

        Configuracion config = repo.findByClave(clave.trim())
                .orElse(new Configuracion());

        config.setClave(clave.trim());
        config.setValor(valor);
        config.setTipo(tipo == null || tipo.isBlank() ? "CONFIG" : tipo.trim().toUpperCase());
        config.setEstado(estado == null || estado.isBlank() ? "ACTIVO" : estado.trim().toUpperCase());

        repo.save(config);
    }

    public void eliminar(Integer id) {
        repo.deleteById(id);
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
                        config.getEstado(),
                        config.getTipo()
                );
            })
            .toList();
}
    
    public void actualizarValor(Integer id, String valor) {
        actualizarDatos(id, null, valor, null, null);
    }

    public void actualizarDatos(Integer id, String clave, String valor, String tipo, String estado) {

        Configuracion config = repo.findById(id).orElseThrow();

        if (clave != null) {
            config.setClave(clave.trim());
        }

        if (valor != null) {
            config.setValor(valor);
        }

        if (tipo != null && !tipo.isBlank()) {
            config.setTipo(tipo.trim().toUpperCase());
        }

        if (estado != null && !estado.isBlank()) {
            config.setEstado(estado.trim().toUpperCase());
        }

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
