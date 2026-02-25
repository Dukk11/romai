/**
 * Erzeugt eine UUID v4 kompatible ID.
 * Nutzt crypto.getRandomValues() wenn verfügbar, sonst Math.random() Fallback.
 */
export function generateId(): string {
    // Versuche crypto API (verfügbar in RN Hermes & Web)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // Fallback: UUID v4 Format mit Math.random
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
