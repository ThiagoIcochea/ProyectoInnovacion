package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.SolicitudCrearRequest;
import com.nethink.b2b.entity.MetodoPago;
import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.repository.MetodoPagoRepository;
import com.nethink.b2b.service.PagoService;
import com.nethink.b2b.service.SolicitudService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.security.Principal;

@RestController
@RequestMapping("/api/solicitudes")
public class SolicitudController {

    private final SolicitudService solicitudService;
    private final MetodoPagoRepository metodoPagoRepository; 
    private final PagoService pagoService;

    public SolicitudController(SolicitudService solicitudService, 
                               MetodoPagoRepository metodoPagoRepository, 
                               PagoService pagoService) {
        this.solicitudService = solicitudService;
        this.metodoPagoRepository = metodoPagoRepository;
        this.pagoService = pagoService;
    }

    @PostMapping("/crear")
    public ResponseEntity<?> crear(@RequestBody SolicitudCrearRequest request, Principal principal) {
        String correo = principal.getName();
        return ResponseEntity.ok(solicitudService.crearSolicitud(request, correo));
    }

    @GetMapping("/proveedor/{idProveedor}/metodos-pago")
    public ResponseEntity<List<MetodoPago>> obtenerMetodosPago(@PathVariable Integer idProveedor) {
        return ResponseEntity.ok(metodoPagoRepository.findByIdProveedor(idProveedor));
    }

    @PostMapping(value = "/{idSolicitud}/pagar", consumes = "multipart/form-data")
    public ResponseEntity<?> pagar(@PathVariable Integer idSolicitud,
                                   @RequestParam("archivo") MultipartFile archivo,
                                   @RequestParam("entidad") String entidad,
                                   @RequestParam("codigoOperacion") String codigoOperacion,
                                   @RequestParam("monto") Double monto,
                                   @RequestParam("metodo") String metodo,
                                   @RequestParam("direccion") String direccion) {
        try {
            return ResponseEntity.ok(pagoService.registrarPago(idSolicitud, archivo, entidad, 
                                     codigoOperacion, monto, metodo, direccion));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al procesar el pago: " + e.getMessage());
        }
    }
}
