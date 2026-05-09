package com.nethink.b2b.service;

import com.nethink.b2b.entity.Pago;
import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.entity.SolicitudHistorial;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.PagoRepository;
import com.nethink.b2b.repository.SolicitudHistorialRepository;
import com.nethink.b2b.repository.SolicitudRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;

@Service
public class PagoService {

    private final PagoRepository pagoRepo;
    private final SolicitudRepository solicitudRepo;
    private final SolicitudHistorialRepository historialRepo;
    private final UsuarioRepository usuarioRepo;

    private final String UPLOAD_DIR = "C:/uploads/b2b/comprobantes/";

    public PagoService(
            PagoRepository pagoRepo,
            SolicitudRepository solicitudRepo,
            SolicitudHistorialRepository historialRepo,
            UsuarioRepository usuarioRepo
    ) {
        this.pagoRepo = pagoRepo;
        this.solicitudRepo = solicitudRepo;
        this.historialRepo = historialRepo;
        this.usuarioRepo = usuarioRepo;
    }

    // =========================
    // MÉTODO PRINCIPAL LIMPIO
    // =========================
    @Transactional
    public Pago registrarPago(
            Integer idSolicitud,
            MultipartFile archivo,
            String entidad,
            String codigoOp,
            String metodo,
            String direccionConfirmada,
            String correoUsuario
    ) throws IOException {

        Usuario usuario = usuarioRepo.findByCorreo(correoUsuario)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        String urlPublica = guardarArchivo(archivo);

        // 2. Obtener SOLO lo necesario
        Solicitud sol = solicitudRepo.findById(idSolicitud)
                .orElseThrow(() ->
                        new RuntimeException("Solicitud no encontrada"));

        // 3. UPDATE optimizado (NO save(entity))
        solicitudRepo.actualizarPago(
                idSolicitud,
                Solicitud.EstadoSolicitud.PAGO_VALIDANDO,
                direccionConfirmada
        );

      
        Pago pago = new Pago();
        pago.setIdSolicitud(idSolicitud);
        pago.setEntidad(entidad);
        pago.setCodigoOperacion(codigoOp);
        pago.setMonto(sol.getTotal());
        pago.setMetodo(metodo);
        pago.setFechaPago(LocalDateTime.now());
        pago.setEstado(Pago.EstadoPago.VALIDANDO);
        pago.setComprobanteUrl(urlPublica);

        Pago pagoGuardado = pagoRepo.save(pago);

      
        SolicitudHistorial historial = new SolicitudHistorial();
        historial.setSolicitud(sol);
        historial.setEstado("PAGO_VALIDANDO");
        historial.setIdUsuario(usuario.getIdUsuario());
        historial.setDescripcion("Pago enviado y pendiente de validación");
        historial.setFecha(LocalDateTime.now());

        historialRepo.save(historial);

        return pagoGuardado;
    }

    // =========================
    // ARCHIVO (SEPARADO)
    // =========================
    private String guardarArchivo(MultipartFile archivo) throws IOException {

        Path uploadPath = Paths.get(UPLOAD_DIR);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileName =
                System.currentTimeMillis() + "_" + archivo.getOriginalFilename();

        Path filePath = uploadPath.resolve(fileName);

        Files.copy(
                archivo.getInputStream(),
                filePath,
                StandardCopyOption.REPLACE_EXISTING
        );

        return "http://localhost:8080/files/" + fileName;
    }
}