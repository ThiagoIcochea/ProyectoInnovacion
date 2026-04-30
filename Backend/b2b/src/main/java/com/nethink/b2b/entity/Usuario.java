package com.nethink.b2b.entity;

import com.nethink.b2b.entity.enums.EstadoUsuario;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Data
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Integer idUsuario;

    private String nombres;
    private String apellidos;

    @Column(unique = true)
    private String correo;

    private String telefono;
    private String whatsapp;
    private String password;

    private String direccion;

    @ManyToOne
    @JoinColumn(name = "id_rol")
    private Rol rol;

    @Enumerated(EnumType.STRING)
    private EstadoUsuario estado;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;
    
    public String getCorreo() {
    return correo;
}

public String getPassword() {
    return password;
}

public EstadoUsuario getEstado() {
    return estado;
}
}