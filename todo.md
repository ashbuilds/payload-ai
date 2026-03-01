## Issues
- Fields inside rows does not activate for ai generation
- Add Generate all
- Perf: Add flag to disable full collection injection for compose button 
- rename it to aiPlugin
- Error handling and reporting to user when generation fails
- fix ids in prompt for relatational fields, for fields like hasmany with relation it injects id of the relation instead of resolving the relation name etc.
  images": [
  "https://images.printify.com/66c32f6ebb0d2981ff0aa7f3",
  "https://images.printify.com/66c32f75fe735a9a1f0a5ac2",
  "https://images.printify.com/5da0523de45fda73786021c3"
  ]




(() => {
// ====== CONFIG: what you want to fill ======
// Row 0 only for now (start simple). Extend later.
const ENTRY = {
rowIndex: 0,
projectId: "1131", // customer
taskId: "17892",   // casetaskevent
memo: "Weekly standup",
hours: ["0:20", "", "", "", "0:20", "", ""], // 7 days
memoByDay: ["Weekly standup", "", "", "", "Weekly standup", "", ""],
isBillable: "F",
};

const log = (...a) => console.log("[NS-HOOK]", ...a);

const applyEntryToJrparams = (jrparams) => {
const recordFields = jrparams?.[1];
const timeitem = jrparams?.[2]?.timeitem;

    if (!timeitem?.fields || !timeitem?.data) {
      throw new Error("Cannot find timeitem.fields/timeitem.data in jrparams");
    }

    const fields = timeitem.fields;
    const idx = Object.fromEntries(fields.map((f, i) => [f, i]));
    const getIdx = (name) => {
      const i = idx[name];
      if (i == null) throw new Error(`Field not found in payload: ${name}`);
      return i;
    };

    const r = ENTRY.rowIndex ?? 0;
    if (!timeitem.data[r]) throw new Error(`Row ${r} does not exist in timeitem.data`);

    const row = timeitem.data[r];

    // set project/task
    if (idx.customer != null) row[getIdx("customer")] = String(ENTRY.projectId);
    if (idx.casetaskevent != null) row[getIdx("casetaskevent")] = String(ENTRY.taskId);

    // billable + memo
    if (idx.isbillable != null && ENTRY.isBillable != null) row[getIdx("isbillable")] = String(ENTRY.isBillable);
    if (idx.memo != null && ENTRY.memo != null) row[getIdx("memo")] = String(ENTRY.memo);

    // hours + per-day memo
    for (let d = 0; d < 7; d++) {
      const hField = `hours${d}`;
      if (idx[hField] != null) row[getIdx(hField)] = String(ENTRY.hours?.[d] ?? "");

      const mField = `memo${d}`;
      if (idx[mField] != null) row[getIdx(mField)] = String(ENTRY.memoByDay?.[d] ?? "");
    }

    // mark changed
    if (idx.linechanged != null) row[getIdx("linechanged")] = "T";
    for (let d = 0; d < 7; d++) {
      const lc = `linechanged${d}`;
      if (idx[lc] != null) row[getIdx(lc)] = "T";
    }

    // best-effort totals
    const parseHHMM = (v) => {
      if (!v) return 0;
      const [h, m] = String(v).split(":").map(Number);
      return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : 0;
    };
    const toHHMM = (mins) => `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;

    const minsRow = (ENTRY.hours || []).slice(0, 7).reduce((a, v) => a + parseHHMM(v), 0);
    if (idx.hourstotal != null) row[getIdx("hourstotal")] = toHHMM(minsRow);

    if (recordFields) {
      // WARNING: these are record-level totals for the whole sheet; we only update them roughly
      // If your sheet has multiple rows, NetSuite will recalc anyway.
      if (recordFields.hourstotal != null) recordFields.hourstotal = recordFields.hourstotal; // leave it
      if (recordFields.totalhours != null) recordFields.totalhours = recordFields.totalhours; // leave it
    }

    return jrparams;
};

// ====== HOOK XHR and rewrite the outgoing body ======
const _open = XMLHttpRequest.prototype.open;
const _send = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (method, url, ...rest) {
this.__ns = { method, url };
return _open.call(this, method, url, ...rest);
};

XMLHttpRequest.prototype.send = function (body) {
try {
const { method, url } = this.__ns || {};
const isSubmit =
method === "POST" &&
typeof url === "string" &&
url.includes("/app/common/scripting/ClientScriptHandler.nl") &&
typeof body === "string" &&
body.includes("jrmethod=remoteObject.submitDynamicClientRecord");

      if (isSubmit) {
        const params = new URLSearchParams(body);
        const jrparamsRaw = params.get("jrparams");
        if (!jrparamsRaw) throw new Error("jrparams missing from submit body");

        const jrparams = JSON.parse(jrparamsRaw);

        log("Intercepted submitDynamicClientRecord. Applying changes now...");
        const updated = applyEntryToJrparams(jrparams);

        params.set("jrparams", JSON.stringify(updated));

        const newBody = params.toString();
        log("Payload updated. Letting request continue ✅");

        return _send.call(this, newBody);
      }
    } catch (e) {
      log("Hook error (sending original body):", e);
    }

    return _send.call(this, body);
};

log("Installed. Now click Save. It will edit the outgoing save payload for row 0.");
})();