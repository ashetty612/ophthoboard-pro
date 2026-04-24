import type { CasesDatabase, CaseData } from "@/lib/types";

export type RoomId = "room1" | "room2" | "room3" | "custom";

export interface RoomPairing {
  id: RoomId;
  label: string;
  description: string;
  subspecialtyA: string;
  subspecialtyB: string;
  casesPerExaminer: number; // 7 by ABO spec
  durationMinutes: number; // 50
}

export const ROOMS: RoomPairing[] = [
  {
    id: "room1",
    label: "Room 1",
    description: "Anterior Segment + Optics",
    subspecialtyA: "Anterior Segment",
    subspecialtyB: "Optics",
    casesPerExaminer: 7,
    durationMinutes: 50,
  },
  {
    id: "room2",
    label: "Room 2",
    description: "Anterior Segment/External + Pediatric Ophthalmology",
    subspecialtyA: "Anterior Segment",
    subspecialtyB: "Pediatric Ophthalmology",
    casesPerExaminer: 7,
    durationMinutes: 50,
  },
  {
    id: "room3",
    label: "Room 3",
    description: "Neuro-Ophthalmology + Posterior Segment",
    subspecialtyA: "Neuro-Ophthalmology and Orbit",
    subspecialtyB: "Posterior Segment",
    casesPerExaminer: 7,
    durationMinutes: 50,
  },
];

export interface RoomCases {
  room: RoomPairing;
  phaseA: CaseData[]; // examiner 1 (subspecialtyA)
  phaseB: CaseData[]; // examiner 2 (subspecialtyB)
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function getCasesBySubspecialty(db: CasesDatabase, name: string): CaseData[] {
  const s = db.subspecialties.find((x) => x.name === name);
  if (!s) return [];
  return s.cases.filter((c) => c.questions.length > 0);
}

/**
 * Build a room's case lineup. Pulls `casesPerExaminer` from each subspecialty.
 * If a subspecialty is short, fills from the OTHER subspecialty to reach the
 * target case count (mirrors real-world pool availability).
 */
export function buildRoomCases(db: CasesDatabase, room: RoomPairing): RoomCases {
  const poolA = shuffle(getCasesBySubspecialty(db, room.subspecialtyA));
  const poolB = shuffle(getCasesBySubspecialty(db, room.subspecialtyB));
  const target = room.casesPerExaminer;

  const phaseA = poolA.slice(0, target);
  const phaseB = poolB.slice(0, target);

  // Fill shortfalls from the counterpart pool
  if (phaseA.length < target) {
    const need = target - phaseA.length;
    const used = new Set(phaseB.map((c) => c.id));
    const extras = poolB.filter((c) => !used.has(c.id)).slice(0, need);
    phaseA.push(...extras);
  }
  if (phaseB.length < target) {
    const need = target - phaseB.length;
    const used = new Set([...phaseA, ...phaseB].map((c) => c.id));
    const extras = poolA.filter((c) => !used.has(c.id)).slice(0, need);
    phaseB.push(...extras);
  }

  return { room, phaseA, phaseB };
}

export interface AxisScore {
  data: number; // 0..3
  diagnosis: number; // 0..3
  management: number; // 0..3
}

export interface RoomScore {
  roomId: RoomId;
  label: string;
  axis: AxisScore;
  total: number; // data + diagnosis + management, 0..9
}

/**
 * Map a percentage (0-100) to the ABO 0-3 axis scale.
 * >=85 -> 3 (above expected)
 * >=70 -> 2 (expected)
 * >=55 -> 1 (borderline)
 *  <55 -> 0 (below expected)
 */
export function pctToAxis(pct: number): number {
  if (pct >= 85) return 3;
  if (pct >= 70) return 2;
  if (pct >= 55) return 1;
  return 0;
}

export interface PassFailVerdict {
  passed: boolean;
  reason: string;
  roomsAtOrAboveSix: number;
  minRoomTotal: number;
}

/**
 * Compensatory model used by the ABO:
 *   PASS iff  (≥2 rooms with room-total ≥ 6/9)  AND  (no single room < 4/9)
 */
export function computeVerdict(rooms: RoomScore[]): PassFailVerdict {
  if (rooms.length === 0) {
    return { passed: false, reason: "No rooms scored.", roomsAtOrAboveSix: 0, minRoomTotal: 0 };
  }
  const roomsAtOrAboveSix = rooms.filter((r) => r.total >= 6).length;
  const minRoomTotal = Math.min(...rooms.map((r) => r.total));

  if (minRoomTotal < 4) {
    return {
      passed: false,
      reason: `One room fell below the 4/9 floor (scored ${minRoomTotal}/9).`,
      roomsAtOrAboveSix,
      minRoomTotal,
    };
  }
  if (roomsAtOrAboveSix < 2) {
    return {
      passed: false,
      reason: `Only ${roomsAtOrAboveSix} room(s) reached the 6/9 threshold — need at least 2.`,
      roomsAtOrAboveSix,
      minRoomTotal,
    };
  }
  return {
    passed: true,
    reason: `${roomsAtOrAboveSix} room(s) at ≥6/9 and no room below 4/9.`,
    roomsAtOrAboveSix,
    minRoomTotal,
  };
}

export function weakestRoom(rooms: RoomScore[]): RoomScore | null {
  if (rooms.length === 0) return null;
  return rooms.reduce((lo, r) => (r.total < lo.total ? r : lo), rooms[0]);
}

export function weakestAxis(rooms: RoomScore[]): "data" | "diagnosis" | "management" | null {
  if (rooms.length === 0) return null;
  const sum = rooms.reduce(
    (acc, r) => ({
      data: acc.data + r.axis.data,
      diagnosis: acc.diagnosis + r.axis.diagnosis,
      management: acc.management + r.axis.management,
    }),
    { data: 0, diagnosis: 0, management: 0 }
  );
  const entries: Array<["data" | "diagnosis" | "management", number]> = [
    ["data", sum.data],
    ["diagnosis", sum.diagnosis],
    ["management", sum.management],
  ];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}
