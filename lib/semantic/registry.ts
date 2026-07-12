import type { Pack, PackId } from "./types";
import { autoPack } from "./packs/auto";
import { retailPack } from "./packs/retail";
import { bankPack } from "./packs/bank";

const PACKS: Record<PackId, Pack> = {
  auto: autoPack,
  retail: retailPack,
  bank: bankPack,
};

export function getPack(id: string): Pack {
  const p = PACKS[id as PackId];
  if (!p) throw new Error(`Неизвестный пак: ${id}`);
  return p;
}

export function isPackId(id: string): id is PackId {
  return id === "auto" || id === "retail" || id === "bank";
}

export function listPacks(): Pack[] {
  return [autoPack, retailPack, bankPack];
}

/** Компактный манифест пака для LLM-планировщика (без SQL — только id, названия, синонимы). */
export function packManifest(pack: Pack) {
  return {
    id: pack.id,
    title: pack.title,
    metrics: Object.values(pack.metrics).map((m) => ({
      id: m.id,
      title: m.title.ru,
      format: m.format,
    })),
    dimensions: Object.values(pack.dimensions).map((d) => ({
      id: d.id,
      title: d.title.ru,
      kind: d.kind,
    })),
    synonyms: pack.synonyms,
    rbacDimension: pack.rbacDimension,
    defaultMetric: pack.defaultMetric,
    sampleQuestions: pack.sampleQuestions,
  };
}

/** Множества id для валидации плана. */
export function packIds(pack: Pack) {
  return {
    metrics: new Set(Object.keys(pack.metrics)),
    dimensions: new Set(Object.keys(pack.dimensions)),
  };
}
