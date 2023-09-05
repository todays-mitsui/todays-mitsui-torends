import {
  DOMParser,
  HTMLDocument,
} from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { parse as parse_datetime } from "https://deno.land/std@0.201.0/datetime/mod.ts";

export interface ParseResult {
  recordDate: Date;
  fetchDate: Date;
  data: {
    [key: string]: {
      value: string;
      unit: string | null;
    };
  };
}

function getValue(doc: HTMLDocument, name: string): string | null {
  const input = doc.querySelector(`input[type="hidden"][name="${name}"]`);
  return input && input.getAttribute("value");
}

function getLabeledValue(
  doc: HTMLDocument,
  name: string,
): { [label: string]: { value: string; unit: string | null } } {
  const inputTagName = doc.querySelector(
    `input[type="hidden"][name="${name}.tagName"]`,
  );
  const label = inputTagName && inputTagName.getAttribute("value");

  const inputKeyData = doc.querySelector(
    `input[type="hidden"][name="${name}.keyData"]`,
  );
  const value = inputKeyData && inputKeyData.getAttribute("value");

  if (label == null || value == null) {
    throw new Error("parse failed: no value.");
  }

  const inputDataUnit = doc.querySelector(
    `input[type="hidden"][name="${name}.dataUnit"]`,
  );
  const unit = inputDataUnit?.getAttribute("value") || null;

  return { [label]: { value, unit } };
}

export function parse(html: string, fetchDate: Date): ParseResult[] {
  const doc = new DOMParser().parseFromString(html, "text/html");

  if (doc == null) throw new Error("parse failed: no document.");

  const dataCount = doc.querySelectorAll(".icoTime").length;

  const records = [];
  for (let i = 0; i < dataCount; i++) {
    const date = getValue(doc, `innerscanBean[${i}].measurementDateF`);
    const hour = getValue(doc, `innerscanBean[${i}].measurementTimeHH`);
    const minute = getValue(doc, `innerscanBean[${i}].measurementTimeMM`);

    if (date == null || hour == null || minute == null) {
      throw new Error("parse failed: no date.");
    }

    const recordDate = parse_datetime(
      `${date} ${hour}:${minute}`,
      "yyyy年MM月dd日 HH:mm",
    );
    recordDate.setHours(recordDate.getHours() - 9); // JST → UTC

    const sizeStr = getValue(doc, `innerscanBean[${i}].size`);
    if (sizeStr == null) throw new Error("parse failed: no size.");
    const size = parseInt(sizeStr, 10) || 0;

    let data = Object.create(null);
    for (let j = 0; j < size; j++) {
      data = {
        ...data,
        ...getLabeledValue(doc, `innerscanBean[${i}][${j}]`),
      };
    }

    records.push({ recordDate, fetchDate, data });
  }

  return records;
}
