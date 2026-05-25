/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.controller;

import java.util.List; 

import java.security.Principal;



import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;


import com.nethink.b2b.dto.response.PagoResponse;
import com.nethink.b2b.entity.Proveedor;
import com.nethink.b2b.repository.ProveedorRepository;
import com.nethink.b2b.service.PagoService;
import java.util.HashMap;
import java.util.Map;





/**
 *
 * @author USUARIO
 */

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

     
    
    
    private final PagoService pagoService; 
    private final ProveedorRepository proveedorRepo; 
    
    
    public PagoController(PagoService pagoservice, ProveedorRepository proveedorRepo){
    
    this.pagoService= pagoservice; 
    this.proveedorRepo=proveedorRepo; 
    
    
    }
    
    
    
    
    
    
    @GetMapping("/proveedor/mis-pagos")
public ResponseEntity<List<PagoResponse>>
listarMisPagos(Principal principal) {

    Proveedor proveedor =
            proveedorRepo.findByUsuario_Correo(
                    principal.getName())
            .orElseThrow(() ->
                    new RuntimeException(
                            "Proveedor no encontrado"));

    return ResponseEntity.ok(
            pagoService.listarPagosProveedor(
                    proveedor.getIdProveedor())
    );
}
    
    
    
@PutMapping("/{idPago}/aprobar")
public ResponseEntity<?> aprobarPago(
        @PathVariable Integer idPago,
        Principal principal
) {

    pagoService.aprobarPago(idPago,principal.getName());

    Map<String, String> response =
            new HashMap<>();

    response.put(
            "mensaje",
            "Pago aprobado"
    );

    return ResponseEntity.ok(response);
} 
    
    
    
    
    
    
    
    
    
    
    
}
