export interface Record {
  recordDate: Date;
  fetchDate: Date;
  weight: {
    value: number;
    unit: string | null;
  };
  fat: {
    value: number;
    unit: string | null;
  };
  muscleMass: {
    value: number;
    unit: string | null;
  };
  muscleScore: {
    value: number;
    unit: string | null;
  };
  visceralFatLevel: {
    value: number;
    unit: string | null;
  };
  basalMetabolicRate: {
    value: number;
    unit: string | null;
  };
  bodyAge: {
    value: number;
    unit: string | null;
  };
  boneMass: {
    value: number;
    unit: string | null;
  };
}

const kv = await Deno.openKv();

export async function setRecords(records: Record[]) {
  for (const record of records) {
    const dateStr = record.recordDate.toISOString();
    await kv.set(["innerscan", dateStr], record);
  }

  if (records.length == 0) return;

  const lastFetch = records[records.length - 1].fetchDate;
  await setLastFetch(lastFetch);
}

export async function setRecord(record: Record) {
  const dateStr = record.recordDate.toISOString();
  await kv.set(["innerscan", dateStr], record);
}

export async function getRecords(): Promise<Record[]> {
  const iter = kv.list({ prefix: ["innerscan"] });
  const records = [];
  for await (const entry of iter) {
    records.push(entry.value as Record);
  }
  return records;
}

export async function setLastFetch(date: Date) {
  await kv.set(["lastFetch"], date);
}

export async function getLastFetch(): Promise<Date> {
  const entry = await kv.get(["lastFetch"]);

  if (entry.value != null) {
    return entry.value as Date;
  }

  const date = new Date();
  date.setDate(date.getDate() - 3);

  return date;
}
