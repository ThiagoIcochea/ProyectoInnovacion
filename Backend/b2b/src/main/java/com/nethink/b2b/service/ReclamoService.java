package com.nethink.b2b.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.nethink.b2b.dto.request.ActualizarReclamoRequest;
import com.nethink.b2b.dto.request.ReclamoRequest;
import com.nethink.b2b.dto.response.ReclamoHistorialResponse;
import com.nethink.b2b.dto.response.ReclamoProveedorResponse;
import com.nethink.b2b.entity.Reclamo;
import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.entity.Solicitud.EstadoSolicitud;
import com.nethink.b2b.entity.SolicitudHistorial;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.ReclamoRepository;
import com.nethink.b2b.repository.SolicitudHistorialRepository;
import com.nethink.b2b.repository.SolicitudRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReclamoService {

    private static final List<String> ESTADOS_RECLAMO = List.of(
            "ABIERTO",
            "EN_REVISION",
            "RESUELTO",
            "RECHAZADO"
    );

    private final ReclamoRepository reclamoRepository;
    private final SolicitudRepository solicitudRepository;
    private final SolicitudHistorialRepository historialRepository;
    private final UsuarioRepository usuarioRepository;
    private final EmailService emailService;
    private final Cloudinary cloudinary;

    public ReclamoService(
            ReclamoRepository reclamoRepository,
            SolicitudRepository solicitudRepository,
            SolicitudHistorialRepository historialRepository,
            UsuarioRepository usuarioRepository,
            EmailService emailService,
            Cloudinary cloudinary) {

        this.reclamoRepository = reclamoRepository;
        this.solicitudRepository = solicitudRepository;
        this.historialRepository = historialRepository;
        this.usuarioRepository = usuarioRepository;
        this.emailService = emailService;
        this.cloudinary = cloudinary;
    }

    private String subirACloudinary(MultipartFile archivo) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(
                archivo.getBytes(),
                ObjectUtils.asMap("folder", "b2b/reclamos")
        );

        return uploadResult.get("secure_url").toString();
    }

    @Transactional
    public void registrarReclamo(ReclamoRequest request, String correoUsuario) throws IOException {
        Usuario usuario = usuarioRepository
                .findByCorreo(correoUsuario)
                .orElseThrow();

        Solicitud solicitud = solicitudRepository
                .findById(request.getIdSolicitud())
                .orElseThrow();

        Reclamo reclamo = new Reclamo();
        reclamo.setIdSolicitud(solicitud.getIdSolicitud());
        reclamo.setIdUsuario(usuario.getIdUsuario());
        reclamo.setIdProveedor(solicitud.getProveedor().getIdProveedor());
        reclamo.setTipo(request.getTipo());
        reclamo.setDescripcion(request.getDescripcion());
        reclamo.setEstado("ABIERTO");
        reclamo.setFechaCreacion(LocalDateTime.now());

        String evidenciaUrl = null;
        if (request.getEvidencia() != null && !request.getEvidencia().isEmpty()) {
            evidenciaUrl = subirACloudinary(request.getEvidencia());
        }

        reclamo.setEvidenciaUrl(evidenciaUrl);
        reclamoRepository.save(reclamo);

        solicitud.setEstado(EstadoSolicitud.EN_RECLAMO);
        solicitudRepository.save(solicitud);
        guardarHistorialReclamo(solicitud, usuario.getIdUsuario(), "ABIERTO", "Reclamo abierto por el cliente");

        emailService.enviarCorreoReclamoDemora(solicitud, request.getDescripcion(), "");
    }

    @Transactional(readOnly = true)
    public List<ReclamoProveedorResponse> listarReclamosProveedor(Integer idProveedor) {
        return reclamoRepository.findByIdProveedorOrderByFechaCreacionDesc(idProveedor)
                .stream()
                .map(this::toProveedorResponse)
                .toList();
    }

    @Transactional
    public ReclamoProveedorResponse actualizarEstadoProveedor(
            Integer idReclamo,
            Integer idProveedor,
            Integer idUsuario,
            ActualizarReclamoRequest request) {

        Reclamo reclamo = reclamoRepository.findById(idReclamo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reclamo no encontrado"));

        if (!idProveedor.equals(reclamo.getIdProveedor())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El reclamo no pertenece al proveedor autenticado");
        }

        String nuevoEstado = normalizarEstado(request.getEstado());
        reclamo.setEstado(nuevoEstado);
        reclamo.setResolucion(request.getResolucion());

        if ("RESUELTO".equals(nuevoEstado) || "RECHAZADO".equals(nuevoEstado)) {
            reclamo.setFechaResolucion(LocalDateTime.now());
        } else {
            reclamo.setFechaResolucion(null);
        }

        Reclamo guardado = reclamoRepository.save(reclamo);
        solicitudRepository.findById(reclamo.getIdSolicitud())
                .ifPresent(solicitud -> guardarHistorialReclamo(
                        solicitud,
                        idUsuario,
                        nuevoEstado,
                        descripcionCambioReclamo(nuevoEstado, request.getResolucion())
                ));

        return toProveedorResponse(guardado);
    }

    private String normalizarEstado(String estado) {
        String normalizado = estado == null ? "" : estado.trim().toUpperCase();
        if (!ESTADOS_RECLAMO.contains(normalizado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de reclamo invalido");
        }
        return normalizado;
    }

    private void guardarHistorialReclamo(Solicitud solicitud, Integer idUsuario, String estado, String descripcion) {
        SolicitudHistorial historial = new SolicitudHistorial();
        historial.setSolicitud(solicitud);
        historial.setIdUsuario(idUsuario);
        historial.setEstado("RECLAMO_" + estado);
        historial.setDescripcion(descripcion);
        historial.setFecha(LocalDateTime.now());
        historialRepository.save(historial);
    }

    private String descripcionCambioReclamo(String estado, String resolucion) {
        String base = switch (estado) {
            case "ABIERTO" -> "Reclamo reabierto por el proveedor";
            case "EN_REVISION" -> "Reclamo en revision por el proveedor";
            case "RESUELTO" -> "Reclamo resuelto por el proveedor";
            case "RECHAZADO" -> "Reclamo rechazado por el proveedor";
            default -> "Estado del reclamo actualizado";
        };

        if (resolucion == null || resolucion.isBlank()) {
            return base;
        }

        return base + ": " + resolucion.trim();
    }

    private ReclamoProveedorResponse toProveedorResponse(Reclamo reclamo) {
        ReclamoProveedorResponse response = new ReclamoProveedorResponse();
        response.setIdReclamo(reclamo.getIdReclamo());
        response.setIdSolicitud(reclamo.getIdSolicitud());
        response.setIdUsuario(reclamo.getIdUsuario());
        response.setIdProveedor(reclamo.getIdProveedor());
        response.setTipo(reclamo.getTipo());
        response.setDescripcion(reclamo.getDescripcion());
        response.setEvidenciaUrl(reclamo.getEvidenciaUrl());
        response.setEstado(reclamo.getEstado());
        response.setResolucion(reclamo.getResolucion());
        response.setFechaCreacion(reclamo.getFechaCreacion());
        response.setFechaResolucion(reclamo.getFechaResolucion());

        solicitudRepository.findById(reclamo.getIdSolicitud()).ifPresent(solicitud -> {
            response.setDireccionEnvio(solicitud.getDireccionEnvio());
            response.setTotalSolicitud(solicitud.getTotal());
            response.setEstadoSolicitud(solicitud.getEstado() != null ? solicitud.getEstado().name() : null);

            if (solicitud.getUsuario() != null) {
                Usuario usuario = solicitud.getUsuario();
                response.setNombreCliente((usuario.getNombres() + " " + usuario.getApellidos()).trim());
                response.setCorreoCliente(usuario.getCorreo());
                response.setTelefonoCliente(usuario.getTelefono());
            }

            if (solicitud.getEmpresaCompradora() != null) {
                response.setNombreEmpresa(solicitud.getEmpresaCompradora().getRazonSocial());
            }

            response.setHistorial(historialRepository
                    .findBySolicitud_IdSolicitudOrderByFechaAsc(solicitud.getIdSolicitud())
                    .stream()
                    .filter(item -> item.getEstado() != null && item.getEstado().startsWith("RECLAMO_"))
                    .map(item -> new ReclamoHistorialResponse(
                            item.getEstado().replace("RECLAMO_", ""),
                            item.getDescripcion(),
                            item.getFecha()
                    ))
                    .toList());
        });

        return response;
    }
}
