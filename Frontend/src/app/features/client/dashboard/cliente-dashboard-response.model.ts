
import { ClienteSolicitudesIndicadorResponse } from "./clientesolicitudesindicador-response.model";
import { ClienteAprobadasIndicadorResponse } from "./clienteaprobadasindicador-response.model";
import { ClienteSolicitudesMensualesResponse } from "./clientesolicitudesmensuales-response.model";
import { ClienteEstadoSolicitudResponse } from "./clienteestadosolicitud-response.model";
import { ClienteProductoSolicitadoResponse } from "./clienteproductosolicitado-response.model";
import { ClienteMontoAprobadoMensualResponse } from "./clientemontoaprobadomensual-response.model";



export interface ClienteDashboardResponse {

  nombreCliente: string;

  solicitudes: ClienteSolicitudesIndicadorResponse;

  aprobadas: ClienteAprobadasIndicadorResponse;

  graficoEvolucionSolicitudes: ClienteSolicitudesMensualesResponse[];

  graficoEstadosSolicitudes: ClienteEstadoSolicitudResponse[];

  graficoProductosSolicitados: ClienteProductoSolicitadoResponse[];

  graficoMontoAprobado: ClienteMontoAprobadoMensualResponse[];

}































