package com.nethink.b2b.service;

import com.nethink.b2b.entity.Pago;
import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.repository.PagoRepository;
import com.nethink.b2b.repository.SolicitudRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.LocalDateTime;

@Service
public class PagoService {

    private final PagoRepository pagoRepo;
    private final SolicitudRepository solicitudRepo;
    private final String UPLOAD_DIR = "C:/uploads/b2b/comprobantes/";

    public PagoService(PagoRepository pagoRepo, SolicitudRepository solicitudRepo) {
        this.pagoRepo = pagoRepo;
        this.solicitudRepo = solicitudRepo;
    }

    @Transactional
    public Pago registrarPago(Integer idSolicitud, MultipartFile archivo, String entidad, 
                             String codigoOp, Double monto, String metodo, String direccionConfirmada) throws IOException {
        
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

        String fileName = System.currentTimeMillis() + "_" + archivo.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(archivo.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        String urlPublica = "http://localhost:8080/files/" + fileName;

        Solicitud sol = solicitudRepo.findById(idSolicitud)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));
        sol.setEstado(Solicitud.EstadoSolicitud.PAGO_VALIDANDO);
        sol.setDireccionEnvio(direccionConfirmada);
        solicitudRepo.save(sol);

        Pago pago = new Pago();
        pago.setIdSolicitud(idSolicitud);
        pago.setEntidad(entidad);
        pago.setCodigoOperacion(codigoOp);
        pago.setMonto(BigDecimal.valueOf(monto));
        pago.setMetodo(metodo);
        pago.setFechaPago(LocalDateTime.now());
        pago.setEstado(Pago.EstadoPago.VALIDANDO);
        pago.setComprobanteUrl(urlPublica);

        return pagoRepo.save(pago);
    }
}
