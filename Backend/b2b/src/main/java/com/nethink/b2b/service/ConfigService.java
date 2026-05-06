/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.nethink.b2b.service;

import com.nethink.b2b.entity.Configuracion;
import com.nethink.b2b.repository.ConfiguracionRepository;
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
}
