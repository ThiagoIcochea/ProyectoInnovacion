package com.nethink.b2b.controller;

import com.nethink.b2b.dto.request.RFQRequest;
import com.nethink.b2b.dto.response.RFQProveedorResponse;
import com.nethink.b2b.service.RFQService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rfq")
@CrossOrigin(origins = "http://localhost:4200")
public class RFQController {

    private final RFQService rfqService;

    public RFQController(RFQService rfqService) {
        this.rfqService = rfqService;
    }

    @PostMapping("/buscar-proveedores")
    public ResponseEntity<List<RFQProveedorResponse>> buscarProveedores(@RequestBody RFQRequest request) {
        

        List<RFQProveedorResponse> resultados = rfqService.buscarYCalificarProveedores(request);
        
        if (resultados.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        
        return ResponseEntity.ok(resultados);
    }
}
