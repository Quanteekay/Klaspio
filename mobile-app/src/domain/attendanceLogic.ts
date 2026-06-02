import type Attendance from "@/src/models/Attendance";

export interface AttendanceStats {
  total: number;
  present: number;
  late: number;
  absent: number;
  attendedPercent: number;
}

export function getAttendanceStats(records: Attendance[]): AttendanceStats {
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const late = records.filter((r) => r.status === "late").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const attendedPercent =
    total === 0 ? 0 : Math.round(((present + late) / total) * 100);

  return { total, present, late, absent, attendedPercent };
}
