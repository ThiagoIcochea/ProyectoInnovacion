


import { ProductoMasVendido } from "./producto-mas-vendido.model";
import { IngresoMensual } from "./ingreso-mensual.model";

export interface DashboardResponse {

  // indicadores solicitudes
  solicitudesMesActual: number;
  solicitudesMesAnterior: number;
  porcentajeSolicitudes: number;

  // ingresos
  ingresosMesActual: number;
  ingresosMesAnterior: number;
  porcentajeIngresos: number;

  // solicitudes aprobadas
  solicitudesAprobadasMesActual: number;
  solicitudesAprobadasMesAnterior: number;
  porcentajeSolicitudesAprobadas: number;

  // gráficos
  graficoIngresos: IngresoMensual[];

  // productos más vendidos
  productosMasVendidos: ProductoMasVendido[];
}













