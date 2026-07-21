/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

package com.nethink.b2b.controller;

import java.security.Principal;



import com.nethink.b2b.service.DashboardService;
import com.nethink.b2b.dto.response.ProveedorDashboardResponse;
import com.nethink.b2b.repository.ProveedorRepository;
import com.nethink.b2b.entity.Proveedor; 

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.security.Principal;
import com.nethink.b2b.dto.response.ClienteDashboardResponse; 
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.service.ClienteDashboardService;
import com.nethink.b2b.repository.UsuarioRepository; 

/**
 *
 * @author USUARIO
 */

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    
  


    
    private final DashboardService dashboardService;
    private final ProveedorRepository proveedorRepo;
    private final ClienteDashboardService clientedashboardservice;
    private final UsuarioRepository usuarioRepo; 

    public DashboardController(
            DashboardService dashboardService,
            ProveedorRepository proveedorRepo, ClienteDashboardService clientedashboardservice, UsuarioRepository usuarioRepo) {

        this.dashboardService = dashboardService;
        this.proveedorRepo = proveedorRepo;
        this.clientedashboardservice=clientedashboardservice;
        this.usuarioRepo=usuarioRepo; 
    }

//    @GetMapping("/proveedor")
//    public ResponseEntity<ProveedorDashboardResponse> obtenerDashboard(
//            Principal principal) {
//
//        Proveedor proveedor =
//                proveedorRepo.findByUsuario_Correo(
//                        principal.getName())
//                .orElseThrow(() ->
//                        new RuntimeException(
//                                "Proveedor no encontrado"));
//
//        return ResponseEntity.ok(
//                dashboardService.obtenerDashboard(
//                      @GetMapping("/proveedor")
    
    @GetMapping("/proveedor")
    public ResponseEntity<ProveedorDashboardResponse> obtenerDashboard(
            Principal principal) {

        Proveedor proveedor =
                proveedorRepo.findByUsuario_Correo(
                        principal.getName())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Proveedor no encontrado"));

        return ResponseEntity.ok(
                dashboardService.obtenerDashboard(  proveedor.getIdProveedor())
        )    ;
    }   
    
    
  @GetMapping("/cliente")
    public ResponseEntity<ClienteDashboardResponse> obtenerDashboardCliente(
            Principal principal) {

        Usuario usuario =
                usuarioRepo.findByCorreo(
                        principal.getName())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Usuario no encontrado"))  ;

        return ResponseEntity.ok(
                clientedashboardservice.clienteObtenerDashboard( usuario.getIdUsuario())
        )     ;
    }   
    
    
    
}



