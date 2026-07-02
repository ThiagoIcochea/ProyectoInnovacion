package com.nethink.b2b.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nethink.b2b.dto.request.GroqMessage;
import com.nethink.b2b.dto.request.GroqRequest;
import com.nethink.b2b.dto.response.VoiceAssistantResponse;
import com.nethink.b2b.entity.Configuracion;
import com.nethink.b2b.entity.Usuario;
import com.nethink.b2b.repository.ConfiguracionRepository;
import com.nethink.b2b.repository.UsuarioRepository;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class VoiceAssistantService {

    private final ConfiguracionRepository configRepository;
    private final UsuarioRepository usuarioRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public VoiceAssistantService(ConfiguracionRepository configRepository, UsuarioRepository usuarioRepository) {
        this.configRepository = configRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public VoiceAssistantResponse respond(String correo, String text, String currentPath) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String rol = usuario.getRol().getNombre().toUpperCase().replace("ROLE_", "");
        String nombre = (usuario.getNombres() + " " + usuario.getApellidos()).trim();
        String prompt = buildPrompt(nombre, rol, currentPath, text);

        try {
            Configuracion config = configRepository.findByClave("AI_COMMENTS").orElseThrow();
            String apiKey = config.getValor();

            GroqMessage system = new GroqMessage();
            system.setRole("system");
            system.setContent(prompt);

            GroqRequest requestBody = new GroqRequest();
            requestBody.setModel("openai/gpt-oss-20b");
            requestBody.setTemperature(0.25);
            requestBody.setMessages(List.of(system));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.groq.com/openai/v1/chat/completions",
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String content = root.path("choices").get(0).path("message").path("content").asText();
            return objectMapper.readValue(content, VoiceAssistantResponse.class);
        } catch (Exception e) {
            VoiceAssistantResponse fallback = new VoiceAssistantResponse();
            fallback.setAction("NONE");
            fallback.setAnswer("Puedo ayudarte a navegar, buscar y preparar acciones segun tu rol, pero ahora no pude consultar la IA. Intenta de nuevo en unos segundos.");
            return fallback;
        }
    }

    public Map<String, String> providerInsights(String correo, Map<String, Object> stats) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String prompt = """
                Eres analista senior de performance B2B para proveedores peruanos de infraestructura/redes. Analiza estas metricas reales y entrega recomendaciones concretas para Peru.
                Proveedor: %s %s
                Estadisticas JSON: %s

                Reglas obligatorias:
                - Responde en espanol peruano, tono ejecutivo y accionable.
                - Usa moneda peruana: soles, formato S/ 0.00. Nunca uses USD, dolares, k USD ni simbolos de otra moneda.
                - Devuelve exactamente 3 puntos si hay poca data o exactamente 5 puntos si hay suficiente data accionable.
                - Formato obligatorio: lista numerada. Cada punto debe ir en una linea separada.
                - Cada item debe tener un titulo corto en negrita y una recomendacion concreta.
                - No devuelvas parrafos largos ni mezcles dos puntos en la misma linea.
                - No uses secciones como diagnostico, riesgos o acciones adicionales.
                - Maximo 170 palabras.
                """.formatted(usuario.getNombres(), usuario.getApellidos(), stats);

        try {
            Configuracion config = configRepository.findByClave("AI_COMMENTS").orElseThrow();
            String apiKey = config.getValor();

            GroqMessage system = new GroqMessage();
            system.setRole("user");
            system.setContent(prompt);

            GroqRequest requestBody = new GroqRequest();
            requestBody.setModel("openai/gpt-oss-20b");
            requestBody.setTemperature(0.45);
            requestBody.setMessages(List.of(system));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.groq.com/openai/v1/chat/completions",
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody, headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String content = root.path("choices").get(0).path("message").path("content").asText();
            return Map.of("analysis", normalizeFiveInsights(content));
        } catch (Exception e) {
            return Map.of("analysis", """
                    1. **Pagos por validar**: reduce los estados PAGO_VALIDANDO con revisiones diarias y responsables claros.
                    2. **Solicitudes pendientes**: responde cada RFQ dentro de un SLA operativo para mejorar conversion.
                    3. **API del proveedor**: conecta la API para actualizar stock, precios y estados sin reprocesos manuales.
                    4. **Reclamos abiertos**: cierra reclamos con evidencia y resolucion para proteger ranking y confianza.
                    5. **Ingresos en soles**: enfoca aprobaciones de mayor valor y mide ingresos estimados en S/ para decisiones locales.
                    """);
        }
    }

    private String buildPrompt(String nombre, String rol, String currentPath, String text) {
        return """
                Eres el asistente operativo por voz de NETHINK B2B. Hablas en espanol claro, natural y ejecutivo.
                No eres chatbot repetitivo: diagnosticas intencion, sabes el flujo B2B y das respuestas utiles.

                Usuario autenticado: %s
                Rol: %s
                Ruta actual: %s
                Orden o consulta del usuario: %s

                Capacidades por rol:
                CLIENTE: dashboard, catalogo RFQ, busquedas de productos, solicitudes, seguimiento, historial, perfil.
                PROVEEDOR: solicitudes recibidas, pagos, entregas, reclamos, productos, configuracion API, perfil.
                ADMIN: dashboard, usuarios, proveedores, RFQs, productos, integraciones, logs, configuracion.

                Acciones asistidas:
                - CLIENTE puede crear solicitudes RFQ, confirmar pedidos, cambiar datos de perfil y pedir tracking.
                - PROVEEDOR puede actualizar productos, stock, API, perfil, revisar solicitudes, pagos, entregas y reclamos.
                - ADMIN puede preparar cambios sobre usuarios, proveedores, productos, RFQs, integraciones y configuracion.
                - MFA no bloquea la intencion: primero recolecta datos y envia/prepara la accion; luego pide MFA solo para confirmar acciones sensibles.
                - Para crear solicitudes cliente, siempre pide RUC de 11 digitos y ubicacion/direccion de entrega si faltan.
                - Para cambios de datos pide campo, valor nuevo y despues indica que se enviara codigo MFA.

                Reglas de seguridad:
                - Nunca permitas acciones fuera del rol. Si el cliente pide logs, productos de proveedor o admin, niega con una alternativa util.
                - Cambiar perfil, API o datos administrativos requiere MFA despues de recopilar los datos: marca requiresMfa=true.
                - Para navegacion devuelve action=NAVIGATE y route permitida.
                - Para busquedas devuelve action=SEARCH y search con el texto limpio.
                - Si detectas logout, tracking, carrito, solicitud RFQ, seleccion de proveedor, confirmacion de pedido o actualizacion de perfil,
                  explica brevemente que el asistente puede guiar la accion y pide el dato faltante si no esta completo.
                - Para consultas sin accion devuelve action=NONE.

                Rutas:
                CLIENTE: /app/dashboard, /app/rfq/catalog, /app/requests, /app/history, /app/profile
                PROVEEDOR: /app/provider/dashboard, /app/provider/requests, /app/provider/payments, /app/provider/deliveries, /app/provider/claims, /app/provider/products, /app/provider/api-settings, /app/provider/profile
                ADMIN: /app/admin/dashboard, /app/admin/users, /app/admin/providers, /app/admin/rfqs, /app/admin/products, /app/admin/integrations, /app/admin/logs, /app/admin/settings

                Responde solamente JSON valido:
                {"answer":"respuesta breve para hablar","action":"NAVIGATE|SEARCH|NONE","route":"ruta o null","search":"texto o null","requiresMfa":false}
                """.formatted(nombre, rol, currentPath, text);
    }

    private String normalizeFiveInsights(String content) {
        String clean = String.valueOf(content == null ? "" : content)
                .replace("\r", "\n")
                .replaceAll("(?m)^\\s*[-*]\\s+", "")
                .trim();

        Pattern itemPattern = Pattern.compile("(?s)(?:^|\\n)\\s*(\\d)\\s*[\\).:-]\\s*(.*?)(?=\\n\\s*\\d\\s*[\\).:-]|$)");
        Matcher matcher = itemPattern.matcher(clean);
        StringBuilder normalized = new StringBuilder();
        int index = 1;

        while (matcher.find() && index <= 5) {
            String item = matcher.group(2)
                    .replaceAll("(?<=\\d)\\s+(?=\\d)", "")
                    .replaceAll(",\\s+(?=\\d)", ",")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (!item.isBlank()) {
                normalized.append(index).append(". ").append(item).append("\n");
                index++;
            }
        }

        if (index > 5) {
            return normalized.toString().trim();
        }

        String[] fallbackItems = clean.split("\\n+");
        for (String fallbackItem : fallbackItems) {
            if (index > 5) {
                break;
            }
            String item = fallbackItem.replaceAll("^\\s*\\d?\\s*[\\).:-]?\\s*", "").replaceAll("\\s+", " ").trim();
            if (!item.isBlank() && !normalized.toString().contains(item)) {
                normalized.append(index).append(". ").append(item).append("\n");
                index++;
            }
        }

        return normalized.toString().trim();
    }
}
