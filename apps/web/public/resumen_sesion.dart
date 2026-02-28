// ─────────────────────────────────────────────────────────────────────────────
// VIBRRA — ResumenSesion Entity
// Colección Firestore: Sesiones/{sesionId}/ResumenSesion (documento único)
//
// Propósito:
//   Consolidar todos los eventos operativos de una sesión musical al momento
//   de su cierre. Reemplaza el almacenamiento de eventos individuales.
//   Los eventos individuales (pujas, nominaciones, VETOs) NO se persisten —
//   solo se acumulan en memoria y se consolidan aquí al cerrar la sesión.
//
// Autor: VIBRRA / AXIOVA S.A.S.
// ─────────────────────────────────────────────────────────────────────────────

import 'package:cloud_firestore/cloud_firestore.dart';

/// Desglose de ingresos por tipo de operación en la sesión.
class IngresosDesglose {
  /// Total cobrado por conexiones de clientes.
  final int conexiones;

  /// Total cobrado por nominaciones pagadas (anónimos + registrados).
  final int nominaciones;

  /// Total cobrado por pujas adicionales (subir posición en cola).
  final int pujas;

  /// Total cobrado por dedicatorias enviadas.
  final int dedicatorias;

  /// Total cobrado por VETOs aplicados.
  final int vetos;

  /// Total bruto de la sesión (suma de todos los conceptos).
  final int totalBruto;

  /// Monto acreditado al anfitrión (70% del total bruto).
  final int anfitrion70;

  /// Monto retenido por VIBRRA (30% del total bruto).
  final int vibrra30;

  const IngresosDesglose({
    required this.conexiones,
    required this.nominaciones,
    required this.pujas,
    required this.dedicatorias,
    required this.vetos,
    required this.totalBruto,
    required this.anfitrion70,
    required this.vibrra30,
  });

  factory IngresosDesglose.fromMap(Map<String, dynamic> map) =>
      IngresosDesglose(
        conexiones:   (map['conexiones']   ?? 0) as int,
        nominaciones: (map['nominaciones'] ?? 0) as int,
        pujas:        (map['pujas']        ?? 0) as int,
        dedicatorias: (map['dedicatorias'] ?? 0) as int,
        vetos:        (map['vetos']        ?? 0) as int,
        totalBruto:   (map['totalBruto']   ?? 0) as int,
        anfitrion70:  (map['anfitrion70']  ?? 0) as int,
        vibrra30:     (map['vibrra30']     ?? 0) as int,
      );

  Map<String, dynamic> toMap() => {
        'conexiones':   conexiones,
        'nominaciones': nominaciones,
        'pujas':        pujas,
        'dedicatorias': dedicatorias,
        'vetos':        vetos,
        'totalBruto':   totalBruto,
        'anfitrion70':  anfitrion70,
        'vibrra30':     vibrra30,
      };
}

/// Métricas de la cola musical durante la sesión.
class MetricasCola {
  /// Total de canciones reproducidas en la sesión.
  final int totalCanciones;

  /// Canciones nominadas y pagadas por clientes.
  final int nominadasPorClientes;

  /// Canciones nominadas por el anfitrión (costo $0, puja inicial $0).
  final int nominadasPorAnfitrion;

  /// Canciones reproducidas como canje publicitario (hasta 10% de la cola).
  final int canjesPublicitarios;

  /// Puja promedio entre todas las operaciones de puja de la sesión (en COP).
  final int pujaPromedio;

  /// Puja máxima registrada en la sesión (en COP).
  final int pujaMaxima;

  const MetricasCola({
    required this.totalCanciones,
    required this.nominadasPorClientes,
    required this.nominadasPorAnfitrion,
    required this.canjesPublicitarios,
    required this.pujaPromedio,
    required this.pujaMaxima,
  });

  factory MetricasCola.fromMap(Map<String, dynamic> map) => MetricasCola(
        totalCanciones:        (map['totalCanciones']        ?? 0) as int,
        nominadasPorClientes:  (map['nominadasPorClientes']  ?? 0) as int,
        nominadasPorAnfitrion: (map['nominadasPorAnfitrion'] ?? 0) as int,
        canjesPublicitarios:   (map['canjesPublicitarios']   ?? 0) as int,
        pujaPromedio:          (map['pujaPromedio']          ?? 0) as int,
        pujaMaxima:            (map['pujaMaxima']            ?? 0) as int,
      );

  Map<String, dynamic> toMap() => {
        'totalCanciones':        totalCanciones,
        'nominadasPorClientes':  nominadasPorClientes,
        'nominadasPorAnfitrion': nominadasPorAnfitrion,
        'canjesPublicitarios':   canjesPublicitarios,
        'pujaPromedio':          pujaPromedio,
        'pujaMaxima':            pujaMaxima,
      };
}

/// Métricas sociales de Match y Dueto generadas durante la sesión.
/// No contienen datos personales identificables.
class MetricasSociales {
  /// Número de matches activados en la sesión.
  final int matchesActivados;

  /// Número de Duetos propuestos por el sistema.
  final int duetosPropuestos;

  /// Número de Duetos confirmados por ambos usuarios.
  final int duetosConcretados;

  /// Número de Duetos cancelados (rechazo, tiempo expirado o falta de saldo).
  final int duetosCancelados;

  /// Ingreso total generado por Duetos (suma de aportes combinados).
  final int ingresosporDuetos;

  const MetricasSociales({
    required this.matchesActivados,
    required this.duetosPropuestos,
    required this.duetosConcretados,
    required this.duetosCancelados,
    required this.ingresosporDuetos,
  });

  factory MetricasSociales.fromMap(Map<String, dynamic> map) =>
      MetricasSociales(
        matchesActivados:    (map['matchesActivados']    ?? 0) as int,
        duetosPropuestos:    (map['duetosPropuestos']    ?? 0) as int,
        duetosConcretados:   (map['duetosConcretados']   ?? 0) as int,
        duetosCancelados:    (map['duetosCancelados']    ?? 0) as int,
        ingresosporDuetos:   (map['ingresosporDuetos']   ?? 0) as int,
      );

  Map<String, dynamic> toMap() => {
        'matchesActivados':    matchesActivados,
        'duetosPropuestos':    duetosPropuestos,
        'duetosConcretados':   duetosConcretados,
        'duetosCancelados':    duetosCancelados,
        'ingresosporDuetos':   ingresosporDuetos,
      };
}

/// Métricas de clientes durante la sesión.
/// Conteos agregados — sin identificadores de personas.
class MetricasClientes {
  /// Total de clientes que se conectaron a la sesión.
  final int totalConectados;

  /// Clientes anónimos (sin cuenta registrada).
  final int anonimos;

  /// Clientes registrados (con cuenta VIBRRA).
  final int registrados;

  /// Clientes que realizaron al menos una operación pagada.
  final int clientesActivos;

  /// Gasto promedio por cliente activo en la sesión (en COP).
  final int gastoPromedioPorCliente;

  /// Clientes que usaron bono de bienvenida (primera vez en VIBRRA).
  final int usaronBonoBienvenida;

  const MetricasClientes({
    required this.totalConectados,
    required this.anonimos,
    required this.registrados,
    required this.clientesActivos,
    required this.gastoPromedioPorCliente,
    required this.usaronBonoBienvenida,
  });

  factory MetricasClientes.fromMap(Map<String, dynamic> map) =>
      MetricasClientes(
        totalConectados:          (map['totalConectados']          ?? 0) as int,
        anonimos:                 (map['anonimos']                 ?? 0) as int,
        registrados:              (map['registrados']              ?? 0) as int,
        clientesActivos:          (map['clientesActivos']          ?? 0) as int,
        gastoPromedioPorCliente:  (map['gastoPromedioPorCliente']  ?? 0) as int,
        usaronBonoBienvenida:     (map['usaronBonoBienvenida']     ?? 0) as int,
      );

  Map<String, dynamic> toMap() => {
        'totalConectados':          totalConectados,
        'anonimos':                 anonimos,
        'registrados':              registrados,
        'clientesActivos':          clientesActivos,
        'gastoPromedioPorCliente':  gastoPromedioPorCliente,
        'usaronBonoBienvenida':     usaronBonoBienvenida,
      };
}

/// Resumen consolidado de una sesión musical VIBRRA.
///
/// Se genera automáticamente al cerrar la sesión.
/// Reemplaza el almacenamiento de eventos individuales.
/// Conservación: 3 años desde la fecha de la sesión.
///
/// Colección Firestore: Sesiones/{sesionId}
/// Campo: resumenSesion (mapa embebido dentro del documento de sesión)
class ResumenSesion {
  /// ID único de la sesión musical.
  final String sesionId;

  /// ID del anfitrión que abrió la sesión.
  final String anfitrionId;

  /// ID del establecimiento donde ocurrió la sesión.
  final String ieId;

  /// Fecha y hora de inicio de la sesión.
  final DateTime fechaInicio;

  /// Fecha y hora de cierre de la sesión.
  final DateTime fechaCierre;

  /// Duración total de la sesión en minutos.
  final int duracionMinutos;

  /// Causa del cierre: 'manual' (anfitrión), 'inactividad' (sistema), 'error'.
  final String causaCierre;

  /// Desglose completo de ingresos por tipo de operación.
  final IngresosDesglose ingresos;

  /// Métricas de la cola musical.
  final MetricasCola cola;

  /// Métricas sociales de Match y Dueto (sin datos personales).
  final MetricasSociales sociales;

  /// Métricas de clientes conectados (conteos agregados).
  final MetricasClientes clientes;

  /// Timestamp de creación del resumen (generado al cierre).
  final DateTime creadoEn;

  const ResumenSesion({
    required this.sesionId,
    required this.anfitrionId,
    required this.ieId,
    required this.fechaInicio,
    required this.fechaCierre,
    required this.duracionMinutos,
    required this.causaCierre,
    required this.ingresos,
    required this.cola,
    required this.sociales,
    required this.clientes,
    required this.creadoEn,
  });

  /// Construye un ResumenSesion desde un documento Firestore.
  factory ResumenSesion.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ResumenSesion(
      sesionId:         doc.id,
      anfitrionId:      data['anfitrionId']  as String,
      ieId:             data['ieId']         as String,
      fechaInicio:      (data['fechaInicio'] as Timestamp).toDate(),
      fechaCierre:      (data['fechaCierre'] as Timestamp).toDate(),
      duracionMinutos:  (data['duracionMinutos'] ?? 0) as int,
      causaCierre:      (data['causaCierre'] ?? 'manual') as String,
      ingresos:         IngresosDesglose.fromMap(
                            data['ingresos'] as Map<String, dynamic>),
      cola:             MetricasCola.fromMap(
                            data['cola'] as Map<String, dynamic>),
      sociales:         MetricasSociales.fromMap(
                            data['sociales'] as Map<String, dynamic>),
      clientes:         MetricasClientes.fromMap(
                            data['clientes'] as Map<String, dynamic>),
      creadoEn:         (data['creadoEn'] as Timestamp).toDate(),
    );
  }

  /// Serializa a mapa para escritura en Firestore.
  Map<String, dynamic> toFirestore() => {
        'anfitrionId':      anfitrionId,
        'ieId':             ieId,
        'fechaInicio':      Timestamp.fromDate(fechaInicio),
        'fechaCierre':      Timestamp.fromDate(fechaCierre),
        'duracionMinutos':  duracionMinutos,
        'causaCierre':      causaCierre,
        'ingresos':         ingresos.toMap(),
        'cola':             cola.toMap(),
        'sociales':         sociales.toMap(),
        'clientes':         clientes.toMap(),
        'creadoEn':         Timestamp.fromDate(creadoEn),
      };
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTRUCTURA FIRESTORE
// ─────────────────────────────────────────────────────────────────────────────
//
// Colección: Sesiones
// Documento: {sesionId}
// {
//   anfitrionId:     "uid_anfitrion",
//   ieId:            "uid_establecimiento",
//   fechaInicio:     Timestamp,
//   fechaCierre:     Timestamp,
//   duracionMinutos: 240,
//   causaCierre:     "manual" | "inactividad" | "error",
//   ingresos: {
//     conexiones:   5000,
//     nominaciones: 12500,
//     pujas:        7000,
//     dedicatorias: 1000,
//     vetos:        500,
//     totalBruto:   26000,
//     anfitrion70:  18200,
//     vibrra30:     7800,
//   },
//   cola: {
//     totalCanciones:        48,
//     nominadasPorClientes:  25,
//     nominadasPorAnfitrion: 18,
//     canjesPublicitarios:   5,
//     pujaPromedio:          700,
//     pujaMaxima:            3500,
//   },
//   sociales: {
//     matchesActivados:   4,
//     duetosPropuestos:   2,
//     duetosConcretados:  1,
//     duetosCancelados:   1,
//     ingresosporDuetos:  2000,
//   },
//   clientes: {
//     totalConectados:         10,
//     anonimos:                5,
//     registrados:             5,
//     clientesActivos:         8,
//     gastoPromedioPorCliente: 2600,
//     usaronBonoBienvenida:    4,
//   },
//   creadoEn: Timestamp,
// }
//
// IMPORTANTE:
// - Los eventos individuales (PujaEvento, NominacionEvento, etc.) NO se persisten.
// - Solo se usan en memoria durante la sesión para acumular los contadores.
// - Al llamar cerrarSesion(), se calcula ResumenSesion y se escribe en Firestore.
// - Los eventos individuales se descartan después del cierre.
// ─────────────────────────────────────────────────────────────────────────────
