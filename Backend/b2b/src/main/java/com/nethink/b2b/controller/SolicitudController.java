package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.SolicitudCrearRequest;
import com.nethink.b2b.dto.response.SolicitudHistorialResponse;
import com.nethink.b2b.dto.response.SolicitudResponse;
import com.nethink.b2b.dto.response.TrackingResponse;
import com.nethink.b2b.entity.MetodoPago;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.MetodoPagoRepository;
import com.nethink.b2b.repository.SolicitudRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import com.nethink.b2b.service.PagoService;
import com.nethink.b2b.service.SolicitudService;

import java.util.List;
import java.security.Principal;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/solicitudes")
public class SolicitudController {

    private final SolicitudService solicitudService;
    private final MetodoPagoRepository metodoPagoRepository;
    private final PagoService pagoService;
    private final UsuarioRepository usuarioRepo;
    private final SolicitudRepository solicitudRepo;

    public SolicitudController(
            SolicitudService solicitudService,
            MetodoPagoRepository metodoPagoRepository,
            PagoService pagoService,
            UsuarioRepository usuarioRepo,
            SolicitudRepository solicitudRepo
    ) {
        this.solicitudService = solicitudService;
        this.metodoPagoRepository = metodoPagoRepository;
        this.pagoService = pagoService;
        this.usuarioRepo = usuarioRepo;
        this.solicitudRepo = solicitudRepo;
    }

    
    @GetMapping("/mis-solicitudes")
    public ResponseEntity<List<SolicitudResponse>> listarMisSolicitudes(Principal principal) {

        Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return ResponseEntity.ok(
                solicitudService.listarMisSolicitudes(usuario.getIdUsuario())
        );
    }
    
   @GetMapping("/mis-solicitudes/historial")
public ResponseEntity<List<SolicitudHistorialResponse>>
listarHistorial(Principal principal) {

    Usuario usuario = usuarioRepo
            .findByCorreo(principal.getName())
            .orElseThrow(() ->
                    new RuntimeException("Usuario no encontrado")
            );

    return ResponseEntity.ok(
            solicitudService.listarHistorial(
                    usuario.getIdUsuario()
            )
    );
}

    @PostMapping("/crear")
    public ResponseEntity<?> crear(
            @RequestBody SolicitudCrearRequest request,
            Principal principal
    ) {
        String correo = principal.getName();
        return ResponseEntity.ok(
                solicitudService.crearSolicitud(request, correo)
        );
    }

    @GetMapping("/proveedor/{idProveedor}/metodos-pago")
    public ResponseEntity<List<MetodoPago>> obtenerMetodosPago(
            @PathVariable Integer idProveedor
    ) {
        return ResponseEntity.ok(
                metodoPagoRepository.findByIdProveedor(idProveedor)
        );
    }

    @PostMapping(value = "/{idSolicitud}/pagar", consumes = "multipart/form-data")
    public ResponseEntity<?> pagar(
            @PathVariable Integer idSolicitud,
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam("entidad") String entidad,
            @RequestParam("codigoOperacion") String codigoOperacion,
            @RequestParam("metodo") String metodo,
            @RequestParam("direccion") String direccion
    ) {

        try {
            return ResponseEntity.ok(
                    pagoService.registrarPago(
                            idSolicitud,
                            archivo,
                            entidad,
                            codigoOperacion,
                            metodo,
                            direccion
                    )
            );

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error al procesar el pago: " + e.getMessage());
        }
    }

    @GetMapping("/{idSolicitud}/tracking")
    public ResponseEntity<?> tracking(@PathVariable Integer idSolicitud) {
        return ResponseEntity.ok(
                solicitudService.obtenerTracking(idSolicitud)
        );
    }
 @PutMapping("/{idSolicitud}/cancelar")
public ResponseEntity<?> cancelar(
        @PathVariable Integer idSolicitud,
        Principal principal
) {

    return ResponseEntity.ok(
            solicitudService.cancelarSolicitud(
                    idSolicitud,
                    principal.getName()
            )
    );
}
}