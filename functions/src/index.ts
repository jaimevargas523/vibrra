/**
 * Cloud Functions VIBRRA — modelo de crédito.
 */

import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions/v2";

initializeApp();
setGlobalOptions({maxInstances: 10});

export {registrarAnfitrion}
  from "./functions/registrarAnfitrion.js";
export {recargarCliente}
  from "./functions/recargarCliente.js";
export {registrarGastoSesion}
  from "./functions/registrarGastoSesion.js";
export {cerrarLiquidacionMensual}
  from "./functions/cerrarLiquidacionMensual.js";
