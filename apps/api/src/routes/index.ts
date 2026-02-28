import { Router } from "express";

import perfilRouter from "./perfil.js";
import negociosRouter from "./negocios.js";
import sesionesRouter from "./sesiones.js";
import colaRouter from "./cola.js";
import movimientosRouter from "./movimientos.js";
import pagosRouter from "./pagos.js";
import bonosRouter from "./bonos.js";
import suscripcionRouter from "./suscripcion.js";
import analyticsRouter from "./analytics.js";
import qrsRouter from "./qrs.js";
import documentosRouter from "./documentos.js";
import resumenRouter from "./resumen.js";

const api = Router();

api.use("/perfil", perfilRouter);
api.use("/negocios", negociosRouter);
api.use("/sesiones", sesionesRouter);
api.use("/cola", colaRouter);
api.use("/movimientos", movimientosRouter);
api.use("/pagos", pagosRouter);
api.use("/bonos", bonosRouter);
api.use("/suscripcion", suscripcionRouter);
api.use("/analytics", analyticsRouter);
api.use("/qrs", qrsRouter);
api.use("/documentos", documentosRouter);
api.use("/resumen", resumenRouter);

export default api;
