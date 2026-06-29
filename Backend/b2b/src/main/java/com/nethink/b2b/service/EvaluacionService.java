package com.nethink.b2b.service;

import com.nethink.b2b.dto.request.RegistrarEvaluacionRequest;
import com.nethink.b2b.dto.response.EvaluacionResponse;
import com.nethink.b2b.entity.Evaluacion;
import com.nethink.b2b.repository.EvaluacionRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;

@Service
public class EvaluacionService {
    
    private final EvaluacionRepository evaluacionRepository;
    
    public EvaluacionService(EvaluacionRepository evaluacionRepository){
        this.evaluacionRepository = evaluacionRepository;
    }

    public EvaluacionResponse registrarEvaluacion(
            RegistrarEvaluacionRequest request) {

        if (evaluacionRepository.existsByIdSolicitud(
                request.getIdSolicitud())) {

            throw new RuntimeException(
                    "La solicitud ya fue evaluada.");
        }

        Evaluacion evaluacion = new Evaluacion();

        evaluacion.setIdSolicitud(request.getIdSolicitud());
        evaluacion.setEstrellasServicio(
                request.getEstrellasServicio());
        evaluacion.setEstrellasCalidad(
                request.getEstrellasCalidad());
        evaluacion.setEstrellasTiempo(
                request.getEstrellasTiempo());
        evaluacion.setEstrellasComunicacion(
                request.getEstrellasComunicacion());
        evaluacion.setComentario(
                request.getComentario());

        evaluacion.setFecha(LocalDateTime.now());

        Evaluacion guardada =
                evaluacionRepository.save(evaluacion);

        EvaluacionResponse response =
                new EvaluacionResponse();

        response.setIdEvaluacion(
                guardada.getIdEvaluacion());
        response.setIdSolicitud(
                guardada.getIdSolicitud());
        response.setEstrellasServicio(
                guardada.getEstrellasServicio());
        response.setEstrellasCalidad(
                guardada.getEstrellasCalidad());
        response.setEstrellasTiempo(
                guardada.getEstrellasTiempo());
        response.setEstrellasComunicacion(
                guardada.getEstrellasComunicacion());
        response.setComentario(
                guardada.getComentario());
        response.setFecha(
                guardada.getFecha());

        return response;
    }

}