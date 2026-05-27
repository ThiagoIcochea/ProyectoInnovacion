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
//se añadio val
import com.nethink.b2b.entity.Proveedor; 


import com.nethink.b2b.repository.ProveedorRepository;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;


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
    private final ProveedorRepository proveedorRepo;  

    public SolicitudController(
            SolicitudService solicitudService,
            MetodoPagoRepository metodoPagoRepository,
            PagoService pagoService,
            UsuarioRepository usuarioRepo,
            SolicitudRepository solicitudRepo,
            ProveedorRepository proveedorRepo
            
    ) {
        this.solicitudService = solicitudService;
        this.metodoPagoRepository = metodoPagoRepository;
        this.pagoService = pagoService;
        this.usuarioRepo = usuarioRepo;
        this.solicitudRepo = solicitudRepo;
        this.proveedorRepo= proveedorRepo; 
        
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
            Principal principal,
            HttpServletRequest httpRequest
    ) {
        String correo = principal.getName();
        return ResponseEntity.ok(
                solicitudService.crearSolicitud(request, correo, httpRequest)
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
            @RequestParam("direccion") String direccion,
            Principal principal,
            HttpServletRequest httpRequest
    ) {

        try {
            return ResponseEntity.ok(
                    pagoService.registrarPago(
                            idSolicitud,
                            archivo,
                            entidad,
                            codigoOperacion,
                            metodo,
                            direccion,
                            principal.getName(),
                            httpRequest
                    )
            );

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Error al procesar el pago: " + e.getMessage());
        }
    }

    @GetMapping("/{idSolicitud}/tracking")
    public ResponseEntity<?> tracking(@PathVariable Integer idSolicitud, Principal principal,HttpServletRequest httpRequest) {
        Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return ResponseEntity.ok(
                solicitudService.obtenerTracking(idSolicitud, usuario.getIdUsuario(),httpRequest)
        );
    }
 @PutMapping("/{idSolicitud}/cancelar")
public ResponseEntity<?> cancelar(
        @PathVariable Integer idSolicitud,
        Principal principal,
        HttpServletRequest httpRequest
) {

    return ResponseEntity.ok(
            solicitudService.cancelarSolicitud(
                    idSolicitud,
                    principal.getName(),
                    httpRequest
            )
    );
}





@GetMapping("/proveedor/mis-solicitudes")
public ResponseEntity<List<SolicitudResponse>> listarMisSolicitudesProveedor(
        Principal principal,HttpServletRequest httpRequest
) {

    Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    Proveedor proveedor = proveedorRepo.findByUsuario_Correo(principal.getName())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "El usuario no tiene un proveedor asociado")
                );

    return ResponseEntity.ok(
            solicitudService.listarSolicitudesProveedor(
                    proveedor.getIdProveedor(), usuario.getIdUsuario(), httpRequest
            )
    );
}


//@GetMapping("/proveedor/{idProveedor}")
//public ResponseEntity<List<SolicitudResponse>>
//listarSolicitudesProveedor(
//        @PathVariable Integer idProveedor
//) {

//    return ResponseEntity.ok(
 //           solicitudService
 //                   .listarSolicitudesProveedor(
 //                           idProveedor
 //                   )
  //  );
//}




@GetMapping("/admin/listar")
public ResponseEntity<List<SolicitudResponse>> listarTodas(Principal principal, HttpServletRequest httpRequest) {
   Usuario usuario = usuarioRepo.findByCorreo(principal.getName())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    return ResponseEntity.ok(
            solicitudService.listarTodasSolicitudes(usuario.getIdUsuario(),httpRequest)
    );
}




}