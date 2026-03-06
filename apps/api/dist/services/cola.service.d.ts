import type { SongInQueue } from "../types/index.js";
export declare function getQueue(sessionId: string): SongInQueue[];
export declare function getPendingQueue(sessionId: string): SongInQueue[];
export declare function addSongToQueue(sessionId: string, titulo: string, artista: string, solicitadoPor: string, precio: number): SongInQueue;
export declare function nextSong(sessionId: string): SongInQueue | null;
