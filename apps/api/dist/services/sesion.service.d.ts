import type { Session } from "../types/index.js";
export declare function getActiveSession(): Session | null;
export declare function getAllSessions(page: number, pageSize: number): {
    data: Session[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};
export declare function getRecentSessions(limit: number): Session[];
export declare function startSession(establecimientoId: string): Session;
export declare function endSession(): Session | null;
