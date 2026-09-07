package com.nethink.b2b.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.http.MediaType;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class SunatServiceTest {
    @Test
    void consultaEmpresaYConstruyeDetalleFiscal() {
        var rest = new RestTemplate();
        var server = MockRestServiceServer.bindTo(rest).build();
        var service = new SunatServiceImpl(rest);
        var config = mock(ConfigService.class);
        ReflectionTestUtils.setField(service, "configService", config);
        when(config.getValor("DECOLECTA_API_TOKEN")).thenReturn("token-prueba");
        server.expect(requestTo("https://api.decolecta.com/v1/sunat/ruc?numero=20123456789"))
                .andExpect(header("Authorization", "Bearer token-prueba"))
                .andRespond(withSuccess("""
                        {"numero_documento":"20123456789","razon_social":"EMPRESA S.A.C.",
                         "direccion":"AV. LIMA 123","estado":"ACTIVO","condicion":"HABIDO"}
                        """, MediaType.APPLICATION_JSON));
        var empresa = service.consultarRuc("20123456789");
        assertEquals("EMPRESA S.A.C.", empresa.getRazonSocial());
        assertTrue(empresa.getDescripcion().contains("ACTIVO"));
        assertTrue(empresa.getDescripcion().contains("AV. LIMA 123"));
        server.verify();
    }
    @Test
    void rechazaRucInvalidoAntesDeConsultar() {
        var service = new SunatServiceImpl(mock(RestTemplate.class));
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> service.consultarRuc("123"));
    }
}
