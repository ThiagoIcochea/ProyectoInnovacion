package com.nethink.b2b.service;

import com.nethink.b2b.entity.Solicitud;
import com.nethink.b2b.entity.Usuario;
import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private ConfigService configService;

    private Resend getResendClient() {

        String apiKey = configService.getValor("RESEND_API_KEY");

        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("No existe RESEND_API_KEY en configuracion_sistema");
        }

        return new Resend(apiKey);
    }

    @Async
    @Override
    public void enviarCorreoCliente(Solicitud solicitud) {

        try {
            if (solicitud == null || solicitud.getUsuario() == null) return;

            Resend resend = getResendClient();

            String html = """
                    <div style='font-family:Arial,sans-serif;background:#f4f6f9;padding:40px'>
                        <div style='max-width:700px;margin:auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1)'>

                            <div style='background:#2563eb;padding:25px;text-align:center;color:white'>
                                <h1 style='margin:0'>NETHINK B2B</h1>
                            </div>

                            <div style='padding:40px'>
                                <h2 style='color:#0f172a'>Solicitud registrada correctamente</h2>

                                <p style='font-size:16px;color:#334155'>
                                    Hola <b>%s</b>,
                                </p>

                                <p style='font-size:15px;color:#475569'>
                                    Tu solicitud fue registrada exitosamente en nuestra plataforma B2B.
                                </p>

                                <div style='background:#eff6ff;padding:20px;border-radius:10px;margin-top:20px'>
                                    <p><b>Código de recepción:</b> %s</p>
                                    <p><b>Total estimado:</b> S/ %s</p>
                                    <p><b>Estado:</b> %s</p>
                                </div>

                                <p style='margin-top:30px;color:#64748b'>
                                    Nuestro proveedor revisará tu solicitud.
                                </p>
                            </div>

                            <div style='background:#f8fafc;padding:20px;text-align:center;color:#94a3b8;font-size:13px'>
                                © 2026 NETHINK B2B
                            </div>

                        </div>
                    </div>
                    """.formatted(
                    solicitud.getUsuario().getNombres(),
                    solicitud.getCodigoRecepcion(),
                    solicitud.getTotal(),
                    solicitud.getEstado()
            );

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from("NETHINK B2B <notificaciones@freecodingvibes.shop>")
                    .to(solicitud.getUsuario().getCorreo())
                    .subject("Confirmación de Solicitud - NETHINK B2B")
                    .html(html)
                    .build();

            resend.emails().send(params);

        } catch (Exception e) {
            System.out.println("Error enviando correo cliente: " + e.getMessage());
        }
    }

    @Async
    @Override
    public void enviarCorreoProveedor(Solicitud solicitud) {

        try {
            if (solicitud == null || solicitud.getProveedor() == null) return;

            Resend resend = getResendClient();

            String html = """
                    <div style='font-family:Arial,sans-serif;background:#f4f6f9;padding:40px'>
                        <div style='max-width:700px;margin:auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1)'>

                            <div style='background:#dc2626;padding:25px;text-align:center;color:white'>
                                <h1 style='margin:0'>Nueva Solicitud Pendiente</h1>
                            </div>

                            <div style='padding:40px'>
                                <p style='font-size:16px;color:#334155'>
                                    Tiene una nueva solicitud pendiente por revisar.
                                </p>

                                <div style='background:#fef2f2;padding:20px;border-radius:10px;margin-top:20px'>
                                    <p><b>Código solicitud:</b> %s</p>
                                    <p><b>Total cotización:</b> S/ %s</p>
                                    <p><b>Cliente:</b> %s %s</p>
                                </div>

                                <p style='margin-top:30px;color:#64748b'>
                                    Ingrese al panel administrativo.
                                </p>
                            </div>

                            <div style='background:#f8fafc;padding:20px;text-align:center;color:#94a3b8;font-size:13px'>
                                © 2026 NETHINK B2B
                            </div>

                        </div>
                    </div>
                    """.formatted(
                    solicitud.getCodigoRecepcion(),
                    solicitud.getTotal(),
                    solicitud.getUsuario().getNombres(),
                    solicitud.getUsuario().getApellidos()
            );

            String correoProveedor = solicitud.getProveedor().getUsuario().getCorreo();

            if (correoProveedor == null || correoProveedor.isBlank()) return;

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from("NETHINK B2B <notificaciones@freecodingvibes.shop>")
                    .to(correoProveedor)
                    .subject("Nueva Solicitud Pendiente - NETHINK B2B")
                    .html(html)
                    .build();

            resend.emails().send(params);

        } catch (Exception e) {
            System.out.println("Error enviando correo proveedor: " + e.getMessage());
        }
    }

    @Async
    public void enviarCorreoRegistroCliente(Usuario usuario) {

        try {

            Resend resend = getResendClient();

            String html = """
                    <div style='font-family:Arial,sans-serif;background:#f4f6f9;padding:40px'>
                        <div style='max-width:700px;margin:auto;background:white;border-radius:12px;overflow:hidden'>

                            <div style='background:#2563eb;padding:30px;text-align:center;color:white'>
                                <h1 style='margin:0'>Bienvenido a NETHINK B2B</h1>
                            </div>

                            <div style='padding:40px'>

                                <h2 style='color:#0f172a'>
                                    Hola %s %s
                                </h2>

                                <p style='font-size:15px;color:#475569'>
                                    Tu cuenta de cliente fue creada correctamente.
                                </p>

                                <div style='background:#eff6ff;padding:20px;border-radius:10px;margin-top:20px'>
                                    <p><b>Correo:</b> %s</p>
                                    <p><b>Estado:</b> %s</p>
                                    <p><b>Fecha registro:</b> %s</p>
                                </div>

                                <p style='margin-top:30px;color:#64748b'>
                                    Ya puedes ingresar a la plataforma y generar solicitudes RFQ.
                                </p>

                            </div>

                            <div style='background:#f8fafc;padding:20px;text-align:center;color:#94a3b8;font-size:13px'>
                                © 2026 NETHINK B2B
                            </div>

                        </div>
                    </div>
                    """.formatted(
                    usuario.getNombres(),
                    usuario.getApellidos(),
                    usuario.getCorreo(),
                    usuario.getEstado(),
                    usuario.getFechaRegistro()
            );

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from("NETHINK B2B <notificaciones@freecodingvibes.shop>")
                    .to(usuario.getCorreo())
                    .subject("Registro exitoso - NETHINK B2B")
                    .html(html)
                    .build();

            resend.emails().send(params);

        } catch (Exception e) {
            System.out.println("Error correo registro cliente: " + e.getMessage());
        }
    }

    @Async
    public void enviarCorreoRegistroProveedor(
            Usuario usuario,
            String razonSocial,
            String ruc
    ) {

        try {

            Resend resend = getResendClient();

            String html = """
                    <div style='font-family:Arial,sans-serif;background:#f4f6f9;padding:40px'>
                        <div style='max-width:700px;margin:auto;background:white;border-radius:12px;overflow:hidden'>

                            <div style='background:#dc2626;padding:30px;text-align:center;color:white'>
                                <h1 style='margin:0'>Proveedor registrado</h1>
                            </div>

                            <div style='padding:40px'>

                                <h2 style='color:#0f172a'>
                                    Bienvenido %s
                                </h2>

                                <p style='font-size:15px;color:#475569'>
                                    Tu empresa fue registrada correctamente en NETHINK B2B.
                                </p>

                                <div style='background:#fef2f2;padding:20px;border-radius:10px;margin-top:20px'>
                                    <p><b>Empresa:</b> %s</p>
                                    <p><b>RUC:</b> %s</p>
                                    <p><b>Correo:</b> %s</p>
                                    <p><b>Estado:</b> %s</p>
                                </div>

                                <p style='margin-top:30px;color:#64748b'>
                                    Ya puedes publicar productos y recibir solicitudes RFQ.
                                </p>

                            </div>

                            <div style='background:#f8fafc;padding:20px;text-align:center;color:#94a3b8;font-size:13px'>
                                © 2026 NETHINK B2B
                            </div>

                        </div>
                    </div>
                    """.formatted(
                    usuario.getNombres(),
                    razonSocial,
                    ruc,
                    usuario.getCorreo(),
                    usuario.getEstado()
            );

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from("NETHINK B2B <notificaciones@freecodingvibes.shop>")
                    .to(usuario.getCorreo())
                    .subject("Proveedor registrado - NETHINK B2B")
                    .html(html)
                    .build();

            resend.emails().send(params);

        } catch (Exception e) {
            System.out.println("Error correo registro proveedor: " + e.getMessage());
        }
    }
}