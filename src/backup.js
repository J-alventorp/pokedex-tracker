const BACKUP_APP = "pokemon-collection-tracker";
const BACKUP_VERSION = 1;

export function buildBackup({ checkedCards, checkedEntities, entityCardChoices, lists, autoListDismissed }) {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    // JSON.stringify(new Set()) is "{}", so spread every Set explicitly.
    checkedCards: [...checkedCards],
    checkedEntities: [...checkedEntities],
    entityCardChoices: entityCardChoices || {},
    lists,
    autoListDismissed: [...autoListDismissed],
  };
}

export function backupFilename(date = new Date()) {
  return `pokemon-collection-${date.toISOString().slice(0, 10)}.json`;
}

function isValidList(l) {
  if (!l || typeof l !== "object") return false;
  if (typeof l.id !== "string" || typeof l.name !== "string") return false;
  if (l.kind === "cards") return Array.isArray(l.cardIds);
  return Array.isArray(l.entities) && Array.isArray(l.checked);
}

export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON — pick a backup this app made.");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("That doesn't look like a collection backup.");
  }
  if (data.version !== BACKUP_VERSION) {
    throw new Error(`This backup is version ${data.version ?? "unknown"}, but this app reads version ${BACKUP_VERSION}.`);
  }
  const fields = ["checkedCards", "checkedEntities", "lists", "autoListDismissed"];
  for (const f of fields) {
    if (!Array.isArray(data[f])) throw new Error(`The backup is missing its "${f}" section.`);
  }
  if (!data.lists.every(isValidList)) {
    throw new Error("One of the lists in that backup is malformed.");
  }
  // Last one wins, so a hand-edited file can't produce duplicate React keys.
  const byId = new Map(data.lists.map((l) => [l.id, l]));
  const entityCardChoices = data.entityCardChoices && typeof data.entityCardChoices === "object" && !Array.isArray(data.entityCardChoices)
    ? data.entityCardChoices
    : {};
  return {
    checkedCards: data.checkedCards.filter((id) => typeof id === "string"),
    checkedEntities: data.checkedEntities.filter((d) => typeof d === "number"),
    entityCardChoices,
    lists: [...byId.values()],
    autoListDismissed: data.autoListDismissed.filter((d) => typeof d === "number"),
  };
}

export function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
