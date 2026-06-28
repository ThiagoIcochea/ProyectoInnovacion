package com.nethink.b2b.service;

import com.nethink.b2b.entity.ProveedorProducto;
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
                    "RFQ-2026"+solicitud.getIdSolicitud(),
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
    @Override
    public void enviarCorreoEvaluacionCliente(Solicitud solicitud) {
        try {
            if (solicitud == null || solicitud.getUsuario() == null) return;

            Resend resend = getResendClient();

            String html = """
                    <div style='font-family:Arial,sans-serif;background:#f4f6f9;padding:40px'>
                        <div style='max-width:700px;margin:auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.1)'>

                            <div style='background:#10b981;padding:25px;text-align:center;color:white'>
                                <h1 style='margin:0'>Tu entrega fue registrada</h1>
                            </div>

                            <div style='padding:40px'>
                                <h2 style='color:#0f172a'>¿Cómo fue la experiencia con el proveedor?</h2>

                                <p style='font-size:16px;color:#334155'>
                                    Hola <b>%s</b>,
                                </p>

                                <p style='font-size:15px;color:#475569'>
                                    Tu pedido ha sido marcado como entregado. Por favor, califica al proveedor haciendo clic en el siguiente enlace.
                                </p>

                                <div style='background:#eff6ff;padding:20px;border-radius:10px;margin-top:20px'>
                                    <p><b>Código de recepción:</b> %s</p>
                                    <p><b>Total:</b> %s</p>
                                </div>

                                <p style='margin-top:30px;color:#64748b'>
                                    <a href="%s/app/requests/evaluation/%d">Calificar ahora</a>
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
                        configService.getValor("APP_FRONTEND_ORIGIN") != null
                            ? configService.getValor("APP_FRONTEND_ORIGIN")
                            : "https://proyectoinnovacion-1.onrender.com",
                        solicitud.getIdSolicitud());

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from("NETHINK B2B <notificaciones@freecodingvibes.shop>")
                    .to(solicitud.getUsuario().getCorreo())
                    .subject("Califica tu entrega - NETHINK B2B")
                    .html(html)
                    .build();

            resend.emails().send(params);

        } catch (Exception e) {
            System.out.println("Error enviando correo evaluacion: " + e.getMessage());
        }
    }

    @Async
    @Override
    public void enviarCorreoReclamoDemora(Solicitud solicitud, String descripcion, String evidenciaJson) {
        try {
            if (solicitud == null || solicitud.getProveedor() == null) return;

            Resend resend = getResendClient();

            String html = """
                    <div style='font-family:Arial,sans-serif;background:#fff7ed;padding:40px'>
                        <div style='max-width:700px;margin:auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.06)'>
                            <div style='background:#f97316;padding:20px;text-align:center;color:white'>
                                <h1 style='margin:0'>Reclamo por demora</h1>
                            </div>
                            <div style='padding:30px'>
                                <p>Se ha registrado un reclamo por demora para la solicitud <b>%s</b>.</p>
                                <p><b>Cliente:</b> %s</p>
                                <p><b>Descripción:</b><br/>%s</p>
                                <p><b>Evidencia (JSON):</b><br/>%s</p>
                            </div>
                            <div style='background:#f8fafc;padding:20px;text-align:center;color:#94a3b8;font-size:13px'>
                                © 2026 NETHINK B2B
                            </div>
                        </div>
                    </div>
                    """.formatted(
                    solicitud.getCodigoRecepcion(),
                    solicitud.getUsuario() != null ? solicitud.getUsuario().getCorreo() : "Cliente",
                    descripcion,
                    evidenciaJson == null ? "Sin evidencia" : evidenciaJson
            );

            String correoProveedor = solicitud.getProveedor().getUsuario().getCorreo();

            if (correoProveedor == null || correoProveedor.isBlank()) return;

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from("NETHINK B2B <notificaciones@freecodingvibes.shop>")
                    .to(correoProveedor)
                    .subject("Reclamo por demora - " + solicitud.getCodigoRecepcion())
                    .html(html)
                    .build();

            resend.emails().send(params);

        } catch (Exception e) {
            System.out.println("Error enviando correo reclamo: " + e.getMessage());
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
    
    @Async
@Override
public void enviarAlertaStockBajo(ProveedorProducto proveedorProducto) {

    try {

        if (proveedorProducto == null
                || proveedorProducto.getProveedor() == null
                || proveedorProducto.getProveedor().getUsuario() == null) {
            return;
        }

        Resend resend = getResendClient();

        String html = """
                <div style='font-family:Arial,sans-serif;background:#f4f6f9;padding:40px'>
                    <div style='max-width:700px;margin:auto;background:white;border-radius:12px;overflow:hidden'>

                        <div style='background:#f59e0b;padding:25px;text-align:center;color:white'>
                            <h1 style='margin:0'>Alerta de Stock Bajo</h1>
                        </div>

                        <div style='padding:35px'>

                            <p>Hola <b>%s</b>,</p>

                            <p>
                                Tu producto ha alcanzado un nivel bajo de inventario.
                            </p>

                            <div style='background:#fef3c7;padding:20px;border-radius:10px'>

                                <p><b>Producto:</b> %s</p>

                                <p><b>SKU:</b> %s</p>

                                <p><b>Stock actual:</b> %d unidades</p>

                                <p><b>Última actualización:</b> %s</p>

                            </div>

                            <p style='margin-top:25px'>
                                Te recomendamos actualizar el inventario para evitar quedarte sin stock.
                            </p>

                        </div>

                        <div style='background:#f8fafc;padding:20px;text-align:center;color:#94a3b8'>
                            © 2026 NETHINK B2B
                        </div>

                    </div>
                </div>
                """.formatted(
                proveedorProducto.getProveedor().getUsuario().getNombres(),
                proveedorProducto.getProducto().getNombre(),
                proveedorProducto.getProducto().getSkuGlobal(),
                proveedorProducto.getStock(),
                proveedorProducto.getUltimaActualizacionStock()
        );

        CreateEmailOptions params = CreateEmailOptions.builder()
                .from("NETHINK B2B <notificaciones@freecodingvibes.shop>")
                .to(proveedorProducto.getProveedor().getUsuario().getCorreo())
                .subject("⚠ Stock Bajo - " + proveedorProducto.getProducto().getNombre())
                .html(html)
                .build();

        resend.emails().send(params);

    } catch (Exception e) {
        System.out.println("Error correo stock bajo: " + e.getMessage());
    }
}

@Async
@Override
public void enviarAlertaSinStock(ProveedorProducto proveedorProducto) {

    try {

        if (proveedorProducto == null
                || proveedorProducto.getProveedor() == null
                || proveedorProducto.getProveedor().getUsuario() == null) {
            return;
        }

        Resend resend = getResendClient();

        String html = """
                <div style='font-family:Arial;background:#fff7ed;padding:40px'>

                    <div style='max-width:700px;margin:auto;background:white;border-radius:12px;overflow:hidden'>

                        <div style='background:#dc2626;padding:25px;text-align:center;color:white'>
                            <h1>Producto sin Stock</h1>
                        </div>

                        <div style='padding:35px'>

                            <p>Hola <b>%s</b>,</p>

                            <p>
                                Uno de tus productos ya no tiene existencias disponibles.
                            </p>

                            <div style='background:#fee2e2;padding:20px;border-radius:10px'>

                                <p><b>Producto:</b> %s</p>

                                <p><b>SKU:</b> %s</p>

                                <p><b>Stock actual:</b> 0 unidades</p>

                            </div>

                            <p style='margin-top:20px'>
                                Actualiza el inventario lo antes posible para seguir recibiendo solicitudes.
                            </p>

                        </div>

                        <div style='background:#f8fafc;padding:20px;text-align:center;color:#94a3b8'>
                            © 2026 NETHINK B2B
                        </div>

                    </div>

                </div>
                """.formatted(
                proveedorProducto.getProveedor().getUsuario().getNombres(),
                proveedorProducto.getProducto().getNombre(),
                proveedorProducto.getProducto().getSkuGlobal()
        );

        CreateEmailOptions params = CreateEmailOptions.builder()
                .from("NETHINK B2B <notificaciones@freecodingvibes.shop>")
                .to(proveedorProducto.getProveedor().getUsuario().getCorreo())
                .subject("🚨 Producto sin Stock")
                .html(html)
                .build();

        resend.emails().send(params);

    } catch (Exception e) {
        System.out.println("Error correo sin stock: " + e.getMessage());
    }
}


@Async
@Override
public void enviarAlertaReposicionStock(
        ProveedorProducto proveedorProducto,
        Integer stockAnterior
) {

    try {

        if (proveedorProducto == null
                || proveedorProducto.getProveedor() == null
                || proveedorProducto.getProveedor().getUsuario() == null) {
            return;
        }

        Resend resend = getResendClient();

        String html = """
                <div style='font-family:Arial;background:#f0fdf4;padding:40px'>

                    <div style='max-width:700px;margin:auto;background:white;border-radius:12px;overflow:hidden'>

                        <div style='background:#16a34a;padding:25px;text-align:center;color:white'>
                            <h1>Stock Actualizado</h1>
                        </div>

                        <div style='padding:35px'>

                            <p>Hola <b>%s</b>,</p>

                            <p>
                                Se registró correctamente una actualización del inventario.
                            </p>

                            <div style='background:#dcfce7;padding:20px;border-radius:10px'>

                                <p><b>Producto:</b> %s</p>

                                <p><b>SKU:</b> %s</p>

                                <p><b>Stock anterior:</b> %d</p>

                                <p><b>Stock actual:</b> %d</p>

                            </div>

                        </div>

                        <div style='background:#f8fafc;padding:20px;text-align:center;color:#94a3b8'>
                            © 2026 NETHINK B2B
                        </div>

                    </div>

                </div>
                """.formatted(
                proveedorProducto.getProveedor().getUsuario().getNombres(),
                proveedorProducto.getProducto().getNombre(),
                proveedorProducto.getProducto().getSkuGlobal(),
                stockAnterior,
                proveedorProducto.getStock()
        );

        CreateEmailOptions params = CreateEmailOptions.builder()
                .from("NETHINK B2B <notificaciones@freecodingvibes.shop>")
                .to(proveedorProducto.getProveedor().getUsuario().getCorreo())
                .subject("✅ Inventario actualizado")
                .html(html)
                .build();

        resend.emails().send(params);

    } catch (Exception e) {
        System.out.println("Error correo reposición stock: " + e.getMessage());
    }
}
}