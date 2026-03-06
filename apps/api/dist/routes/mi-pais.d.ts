/** PaisConfig shape from Firestore Paises/{code}. */
interface PaisConfig {
    code: string;
    nombre: string;
    activo: boolean;
    moneda: {
        code: string;
        symbol: string;
        locale: string;
    };
    fiscal: {
        iva: number;
        comisionPlataforma: number;
    };
    suscripcion: {
        precioMensual: number;
        saldoMinimoPorEstablecimiento: number;
        bonoActivacion: number;
    };
    recarga: {
        montos: {
            id: string;
            valor: number;
            etiqueta: string;
        }[];
        modos: {
            id: string;
            emoji: string;
            label: string;
        }[];
        tablaBonos: Record<string, Record<string, {
            canciones: number;
            conexiones: number;
        }>>;
        costoExtraGenerosa: number;
        minimoBloqueado: number;
    };
    recargaAnfitrion: {
        planes: {
            amount: number;
            bonusPercent: number;
            bonus: number;
            total: number;
            recommended?: boolean;
        }[];
        pasarela: {
            nombre: string;
            proveedores: string[];
            metodos: string[];
        };
    };
    documentosEstablecimiento: {
        key: string;
        labelKey: string;
    }[];
    legal: {
        terminos: {
            url: string;
            version: string;
        };
        politicaDatos: {
            url: string;
            version: string;
        };
    };
    bancos: {
        key: string;
        nombre: string;
    }[];
    tiposCuenta: {
        key: string;
        nombre: string;
    }[];
    tiposPersona: {
        key: string;
        nombre: string;
    }[];
    regimenesTributarios: {
        key: string;
        nombre: string;
    }[];
}
declare const router: import("express-serve-static-core").Router;
declare function getPaisConfig(code: string): Promise<PaisConfig | null>;
export default router;
export { getPaisConfig };
