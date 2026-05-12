package com.nethink.b2b.service;

import com.nethink.b2b.dto.response.PublicidadResponse;
import com.nethink.b2b.entity.Publicidad;
import com.nethink.b2b.repository.PublicidadRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PublicidadService {

    private final PublicidadRepository repository;

    public PublicidadService(PublicidadRepository repository) {
        this.repository = repository;
    }

public List<PublicidadResponse> listarActivas() {

    LocalDateTime now = LocalDateTime.now();

    List<Publicidad> lista = repository.findActivas(
            Publicidad.Estado.ACTIVO,
            now
    );

    return lista.stream().map(p -> {

        PublicidadResponse dto = new PublicidadResponse();

        dto.setIdPublicidad(p.getIdPublicidad());
        dto.setTitulo(p.getTitulo());
        dto.setImagen(p.getImagen());
        dto.setEnlace(p.getEnlace());

        dto.setProveedor(
                p.getProveedor() != null
                        ? p.getProveedor().getRazonSocial()
                        : "Interno"
        );

        dto.setOrigen(p.getOrigen().name());
        dto.setFechaInicio(p.getFechaInicio());
        dto.setFechaFin(p.getFechaFin());

        return dto;

    }).toList();
}
}