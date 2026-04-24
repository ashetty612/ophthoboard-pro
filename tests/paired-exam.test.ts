import { describe, it, expect } from "vitest";
import {
  ROOMS,
  buildRoomCases,
  computeVerdict,
  pctToAxis,
  weakestAxis,
  weakestRoom,
  type RoomPairing,
} from "@/lib/paired-exam";
import type { CasesDatabase, CaseData, Question, Subspecialty } from "@/lib/types";

function makeQ(n: number): Question {
  return {
    number: n,
    question: `Q${n}`,
    answer: "a",
    keyPoints: [],
    scoringKeywords: ["kw"],
  };
}

function makeCase(id: string, subspecialty: string): CaseData {
  return {
    id,
    caseNumber: Number(id.replace(/\D/g, "")) || 1,
    source: "test",
    title: `Case ${id}`,
    subspecialty,
    presentation: "p",
    imageFile: null,
    imageFiles: [],
    photoDescription: "",
    questions: [makeQ(1), makeQ(2), makeQ(5)],
  };
}

function makeDB(counts: Record<string, number>): CasesDatabase {
  const subs: Subspecialty[] = Object.entries(counts).map(([name, n]) => ({
    id: name.toLowerCase().replace(/[^a-z]+/g, "-"),
    name,
    cases: Array.from({ length: n }, (_, i) => makeCase(`${name}-${i + 1}`, name)),
  }));
  return {
    metadata: { title: "t", editor: "e", totalPages: 0, extractedAt: "" },
    subspecialties: subs,
  };
}

describe("ROOMS preset pairings", () => {
  it("has 3 rooms, each 50 min with 7 cases per examiner", () => {
    expect(ROOMS).toHaveLength(3);
    for (const r of ROOMS) {
      expect(r.casesPerExaminer).toBe(7);
      expect(r.durationMinutes).toBe(50);
    }
  });
});

describe("buildRoomCases — case picking", () => {
  it("Room 1 pulls 7 Anterior Segment + 7 Optics cases", () => {
    const db = makeDB({ "Anterior Segment": 10, Optics: 10 });
    const room1 = ROOMS[0];
    const rc = buildRoomCases(db, room1);
    expect(rc.phaseA).toHaveLength(7);
    expect(rc.phaseB).toHaveLength(7);
    expect(rc.phaseA.every((c) => c.subspecialty === "Anterior Segment")).toBe(true);
    expect(rc.phaseB.every((c) => c.subspecialty === "Optics")).toBe(true);
  });

  it("fills shortfall from the other subspecialty when pool A is small", () => {
    const db = makeDB({ "Anterior Segment": 3, Optics: 12 });
    const rc = buildRoomCases(db, ROOMS[0]);
    expect(rc.phaseA).toHaveLength(7);
    expect(rc.phaseB).toHaveLength(7);
    // At least one phaseA case should have come from Optics (the filler pool)
    const opticsInA = rc.phaseA.filter((c) => c.subspecialty === "Optics").length;
    expect(opticsInA).toBeGreaterThanOrEqual(4);
  });

  it("phaseA and phaseB combined have no duplicate case ids", () => {
    const db = makeDB({ "Anterior Segment": 5, Optics: 5 });
    const rc = buildRoomCases(db, ROOMS[0]);
    const ids = [...rc.phaseA, ...rc.phaseB].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("pctToAxis mapping (0-3)", () => {
  it("maps ABO percentage bands to 0-3 axis scores", () => {
    expect(pctToAxis(95)).toBe(3);
    expect(pctToAxis(75)).toBe(2);
    expect(pctToAxis(60)).toBe(1);
    expect(pctToAxis(40)).toBe(0);
  });
});

describe("computeVerdict — compensatory pass/fail", () => {
  const mk = (total: number, id: "room1" | "room2" | "room3") => ({
    roomId: id,
    label: id,
    total,
    axis: { data: 1, diagnosis: 1, management: 1 },
  });

  it("PASS when ≥2 rooms ≥6/9 AND no room below 4/9", () => {
    const v = computeVerdict([mk(7, "room1"), mk(6, "room2"), mk(5, "room3")]);
    expect(v.passed).toBe(true);
  });

  it("FAIL when a single room drops below 4/9", () => {
    const v = computeVerdict([mk(9, "room1"), mk(9, "room2"), mk(3, "room3")]);
    expect(v.passed).toBe(false);
    expect(v.reason).toMatch(/4\/9/);
  });

  it("FAIL when fewer than 2 rooms reach 6/9", () => {
    const v = computeVerdict([mk(7, "room1"), mk(5, "room2"), mk(5, "room3")]);
    expect(v.passed).toBe(false);
    expect(v.roomsAtOrAboveSix).toBe(1);
  });

  it("PASS exactly at thresholds (2 rooms at 6, min 4)", () => {
    const v = computeVerdict([mk(6, "room1"), mk(6, "room2"), mk(4, "room3")]);
    expect(v.passed).toBe(true);
  });
});

describe("weakestRoom / weakestAxis", () => {
  it("weakestRoom returns the lowest-scoring room", () => {
    const rooms = [
      { roomId: "room1" as const, label: "a", total: 8, axis: { data: 3, diagnosis: 2, management: 3 } },
      { roomId: "room2" as const, label: "b", total: 4, axis: { data: 1, diagnosis: 1, management: 2 } },
    ];
    expect(weakestRoom(rooms)?.roomId).toBe("room2");
  });

  it("weakestAxis returns the lowest-summed axis across rooms", () => {
    const rooms = [
      { roomId: "room1" as const, label: "a", total: 6, axis: { data: 3, diagnosis: 1, management: 2 } },
      { roomId: "room2" as const, label: "b", total: 6, axis: { data: 3, diagnosis: 1, management: 2 } },
    ];
    expect(weakestAxis(rooms)).toBe("diagnosis");
  });
});

// Silence unused-var warning (custom room type is exercised indirectly via ROOMS)
void (null as unknown as RoomPairing);
