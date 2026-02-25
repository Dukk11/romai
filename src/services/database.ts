import * as SQLite from 'expo-sqlite';
import { Measurement, JointType, MovementType, BodySide } from '../types';

const DB_NAME = 'romai.db';

/**
 * Mappt eine DB-Zeile (snake_case) auf das Measurement-Interface (camelCase).
 */
function mapRowToMeasurement(row: any): Measurement {
    return {
        id: row.id,
        jointType: row.joint_type,
        movementType: row.movement_type,
        bodySide: row.body_side,
        angle: row.angle,
        neutralZeroFormat: row.neutral_zero_format ?? undefined,
        confidence: row.confidence,
        timestamp: row.timestamp,
        videoFrameUri: row.video_frame_uri ?? undefined,
        notes: row.notes ?? undefined,
        painLevel: row.pain_level ?? undefined,
        syncStatus: row.sync_status,
        userId: row.user_id,
        patientId: row.patient_id ?? undefined,
    };
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
    const db = await SQLite.openDatabaseAsync(DB_NAME);

    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS measurements (
      id TEXT PRIMARY KEY,
      joint_type TEXT NOT NULL,
      movement_type TEXT NOT NULL,
      body_side TEXT NOT NULL CHECK(body_side IN ('left', 'right')),
      angle REAL NOT NULL,
      confidence REAL NOT NULL,
      timestamp TEXT NOT NULL,
      video_frame_uri TEXT,
      notes TEXT,
      pain_level INTEGER CHECK(pain_level >= 0 AND pain_level <= 10),
      sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending', 'synced', 'failed')),
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_measurements_timestamp ON measurements(timestamp);
    CREATE INDEX IF NOT EXISTS idx_measurements_joint ON measurements(joint_type, movement_type);
    CREATE INDEX IF NOT EXISTS idx_measurements_sync ON measurements(sync_status);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      joint_type TEXT NOT NULL,
      body_side TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      user_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      date_of_birth TEXT,
      diagnosis TEXT,
      operation_date TEXT,
      operation_type TEXT,
      target_joint TEXT,
      target_side TEXT,
      treating_physician TEXT,
      physiotherapist TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete')),
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    );
  `);

    try {
        await db.execAsync(`ALTER TABLE measurements ADD COLUMN neutral_zero_format TEXT;`);
    } catch (e) {
        // Ignorieren, Spalte existiert bereits
    }

    try {
        await db.execAsync(`ALTER TABLE measurements ADD COLUMN patient_id TEXT;`);
    } catch (e) {
        // Ignorieren, Spalte existiert bereits
    }

    return db;
}

// CRUD Operations
export async function insertMeasurement(db: SQLite.SQLiteDatabase, m: Measurement): Promise<void> {
    await db.runAsync(
        `INSERT INTO measurements(id, joint_type, movement_type, body_side, angle, neutral_zero_format, confidence, timestamp, video_frame_uri, notes, pain_level, sync_status, user_id, patient_id)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, m.jointType, m.movementType, m.bodySide, m.angle, m.neutralZeroFormat || null, m.confidence, m.timestamp, m.videoFrameUri || null, m.notes || null, m.painLevel ?? null, m.syncStatus, m.userId, m.patientId || null]
    );
}

export async function getMeasurements(
    db: SQLite.SQLiteDatabase,
    jointType: JointType,
    movementType: MovementType,
    bodySide: BodySide,
    limit: number = 90
): Promise<Measurement[]> {
    const rows = await db.getAllAsync(
        `SELECT * FROM measurements
     WHERE joint_type = ? AND movement_type = ? AND body_side = ?
        ORDER BY timestamp DESC LIMIT ?`,
        [jointType, movementType, bodySide, limit]
    );
    return rows.map(mapRowToMeasurement);
}

export async function getLatestMeasurement(
    db: SQLite.SQLiteDatabase,
    jointType: JointType,
    movementType: MovementType,
    bodySide: BodySide
): Promise<Measurement | undefined> {
    const row = await db.getFirstAsync(
        `SELECT * FROM measurements
     WHERE joint_type = ? AND movement_type = ? AND body_side = ?
        ORDER BY timestamp DESC LIMIT 1`,
        [jointType, movementType, bodySide]
    );
    return row ? mapRowToMeasurement(row) : undefined;
}

export async function getAllMeasurements(db: SQLite.SQLiteDatabase): Promise<Measurement[]> {
    const rows = await db.getAllAsync(`SELECT * FROM measurements ORDER BY timestamp DESC`);
    return rows.map(mapRowToMeasurement);
}

export async function getMeasurementCount(db: SQLite.SQLiteDatabase): Promise<number> {
    const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM measurements`);
    return row?.count ?? 0;
}

export async function getPendingSyncItems(db: SQLite.SQLiteDatabase): Promise<any[]> {
    return await db.getAllAsync(
        `SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 50`
    );
}
