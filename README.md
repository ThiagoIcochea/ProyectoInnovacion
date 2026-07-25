# Marketplace B2B - Documentación de Arquitectura

## Descripción general

Marketplace B2B es una plataforma colaborativa desarrollada para conectar empresas proveedoras y compradoras mediante un ecosistema moderno de comercio electrónico empresarial. El proyecto integra autenticación, gestión de productos, panel administrativo, procesos de solicitud y compra, suscripciones, pagos, reclamos y analítica operativa.

Este sistema fue desarrollado de forma colaborativa por:
- Thiago Paolo Icochea Rodriguez
- Iker Jared Rondoy Perez
- Valeri Alexandra Torres Guerrero
- Angel Gabriel Valle Cotera

---

## 1. Visión del proyecto

El objetivo del sistema es permitir que las empresas puedan:
- publicar y gestionar productos o servicios
- interactuar con compradores mediante solicitudes y órdenes de compra
- administrar perfiles de proveedor y comprador
- gestionar pagos, suscripciones y soporte por reclamos
- operar a través de una interfaz moderna, modular y escalable

---

## 2. Arquitectura general

El proyecto sigue una arquitectura por capas con separación clara entre presentación, negocio y acceso a datos. La idea principal es que el frontend gestione la experiencia del usuario, mientras el backend centraliza la lógica de negocio, seguridad y persistencia.

### Arquitectura propuesta

- Frontend: Angular 21 con una estructura modular por módulos y features para separar flujos como autenticación, clientes, proveedores, administración y perfil.
- Backend: Spring Boot 3.5 con Java 21, diseñado para exponer una API REST clara y escalable.
- Persistencia: JPA / Hibernate sobre MySQL para mapear entidades del dominio y gestionar transacciones de forma consistente.
- Seguridad: Spring Security junto con JWT para proteger rutas, validar sesiones y controlar accesos por roles.
- Integraciones: Cloudinary para gestión de imágenes, Resend para correos transaccionales y servicios externos para procesos de pago, notificaciones y consumo de datos.
- Infraestructura: configuración orientada a contenedores y despliegue con Docker, facilitando la ejecución del backend en entornos distintos.

### Flujo técnico de la aplicación

1. El usuario accede a la interfaz web desarrollada en Angular.
2. El frontend utiliza servicios HTTP para consumir los endpoints REST del backend.
3. El backend valida autenticación, permisos y reglas de negocio antes de procesar cualquier operación.
4. Los datos se almacenan en MySQL mediante JPA/Hibernate, usando entidades bien definidas para productos, usuarios, solicitudes, pagos, reclamos y suscripciones.
5. Las imágenes y notificaciones se gestionan mediante servicios externos, lo que permite desacoplar la lógica principal del sistema de recursos auxiliares.
6. El frontend organiza la navegación con rutas protegidas, guardias de acceso y un layout principal que adapta la experiencia según el rol del usuario.

### Enfoque técnico del proyecto

- El frontend sigue un enfoque basado en componentes reutilizables y servicios centralizados para facilitar la escalabilidad.
- El backend está estructurado para separar controladores, servicios y repositorios, lo que mejora el mantenimiento y la incorporación de nuevas funcionalidades.
- La arquitectura está preparada para crecer hacia módulos adicionales sin reorganizar por completo la base del sistema.
- Se busca un equilibrio entre simplicidad y robustez, usando tecnologías modernas pero manteniendo una implementación comprensible para equipos de desarrollo.

---

## 3. Stack tecnológico

### Frontend
- Angular 21
- TypeScript
- RxJS
- SCSS
- Angular Router
- Angular Forms
- Leaflet (mapas/ubicación)
- SweetAlert2
- Vite/Angular build tooling

### Backend
- Java 21
- Spring Boot 3.5.x
- Spring Web
- Spring Data JPA
- Spring Security
- Validation
- Hibernate
- Lombok
- JWT (jjwt)
- MySQL Connector
- dotenv-java

### Herramientas y servicios
- Maven
- Docker
- Cloudinary para almacenamiento de imágenes
- Resend para correos transaccionales
- Swagger-style REST API structure via Spring controllers

---

## 4. Estructura del proyecto

### Frontend
El frontend está organizado en módulos por dominio:
- auth: login, registro, recuperación de contraseña y MFA
- client: experiencia del comprador
- provider: experiencia del proveedor
- admin: panel administrativo
- shared: componentes y servicios reutilizables
- core: guards, interceptors, servicios globales y utilidades

### Backend
El backend sigue una organización orientada a dominio:
- controllers: endpoints REST
- services: lógica de negocio
- repositories: acceso a datos con Spring Data
- entities: modelos JPA
- config: seguridad, filtros, configuración general
- resources: application.properties, schema.sql y recursos estáticos

---

## 5. Modelo de negocio principal

El sistema soporta los siguientes procesos de negocio:
- registro y autenticación de usuarios con roles
- gestión de proveedores y empresas compradoras
- administración de productos, marcas, categorías y stock
- creación de solicitudes, cotizaciones y órdenes de compra
- pagos y validación de comprobantes
- suscripciones y planes
- gestión de reclamos y seguimiento de incidencias
- logs, auditoría y seguridad

---

## 6. Principios de diseño

- Modularidad: separación clara entre frontend y backend
- Escalabilidad: arquitectura preparada para crecer en funcionalidad y volumen
- Seguridad: autenticación JWT y control de acceso por roles
- Mantenibilidad: uso de buenas prácticas en servicios, entidades y estructura de carpetas
- Integración: soporte para servicios externos y carga de contenido multimedia

---

## 7. Consideraciones técnicas relevantes

- El backend usa JPA para modelar entidades relacionales con MySQL.
- El proyecto incluye soporte para manejo de archivos e imágenes así como procesos de notificación.
- Se implementan lógicas de negocio complejas para solicitudes, pagos, validaciones de seguridad y seguimiento de operaciones.
- La estructura está preparada para evolucionar a un entorno de producción con mayor separación de servicios y despliegue distribuido.

---

## 8. Resumen ejecutivo

Este proyecto representa una solución B2B completa, moderna y escalable, con un enfoque colaborativo y orientado a la experiencia de negocio. Combina el poder de Angular en el frontend con Spring Boot y MySQL en el backend para ofrecer una plataforma funcional, modular y preparada para extenderse.

---

## 9. English version

# B2B Marketplace - Architecture Documentation

## Overview

B2B Marketplace is a collaborative platform designed to connect supplier and buyer companies through a modern business-to-business e-commerce ecosystem. The project integrates authentication, product management, administrative dashboards, purchasing workflows, subscriptions, payments, claims, and operational analytics.

This system was developed collaboratively by:
- Thiago Paolo Icochea Rodriguez
- Iker Jared Rondoy Perez
- Valeri Alexandra Torres Guerrero
- Angel Gabriel Valle Cotera


## Project purpose

The platform enables companies to:
- publish and manage products or services
- interact with buyers through requests and purchase orders
- manage supplier and buyer profiles
- handle payments, subscriptions, and support cases
- operate through a modern, modular, and scalable interface

## Architecture

The application follows a layered architecture with a clear separation between presentation, business logic, and data access.

### Proposed architecture
- Frontend: Angular 21 with a modular structure organized by features for authentication, client flows, provider flows, admin flows, and shared UI.
- Backend: Spring Boot 3.5 with Java 21, exposing a REST API designed to be maintainable and extensible.
- Persistence: JPA / Hibernate with MySQL for entity mapping and transactional persistence.
- Security: Spring Security with JWT to protect routes and manage access by role.
- Integrations: Cloudinary for media management, Resend for transactional emails, and external services for payments and notifications.
- Deployment: Docker-oriented structure that simplifies environment setup and deployment.

### Runtime flow
1. Users access the Angular web application.
2. The frontend calls REST endpoints provided by the backend through HTTP services.
3. The backend validates authentication, authorization, and business rules before processing any request.
4. Data is stored in MySQL using JPA/Hibernate through clearly defined domain entities.
5. Images, emails, and auxiliary services are handled through external integrations, keeping the core business logic decoupled.
6. The frontend uses protected routes and role-aware navigation to adapt the experience to each user type.

### Technical focus
- The frontend is organized around reusable components and centralized services to facilitate scalability.
- The backend is structured with controllers, services, and repositories to keep business logic organized and maintainable.
- The architecture is prepared to grow with additional modules without requiring a complete redesign.
- The project balances modern technologies with a clear implementation approach suitable for collaborative development.

## Technology stack

### Frontend
- Angular 21
- TypeScript
- RxJS
- SCSS
- Angular Router
- Angular Forms
- Leaflet
- SweetAlert2

### Backend
- Java 21
- Spring Boot 3.5
- Spring Web
- Spring Data JPA
- Spring Security
- Validation
- Hibernate
- Lombok
- JWT
- MySQL Connector
- dotenv-java

### Supporting tools and services
- Maven
- Docker
- Cloudinary
- Resend

## Main business model

The system supports:
- user registration and authentication with roles
- supplier and buyer company management
- products, brands, categories, and inventory management
- requests, quotations, and purchase orders
- payments and proof validation
- subscriptions and plans
- claims and incident tracking
- logs and security auditing

## Design principles

- Modularity
- Scalability
- Security
- Maintainability
- Integration readiness

## Summary

This project is a complete, modern, and scalable B2B solution designed for collaborative development and future expansion. It combines Angular on the frontend with Spring Boot and MySQL on the backend to deliver a functional and extensible platform.
