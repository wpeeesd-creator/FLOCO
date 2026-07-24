const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
initializeApp({ credential: cert(require("./serviceAccountKey.json")) });
const db = getFirestore();

const BASE = new Set(["createdAt","fee","price","quantity","stockName","ticker","total","type","id"]);

(async () => {
  const snap = await db.collection("users").get();
  let totalTx = 0, users = 0;
  const extraFieldCount = {};
  const perUser = [];

  snap.forEach(doc => {
    const d = doc.data();
    const tx = Array.isArray(d.transactions) ? d.transactions : [];
    if (tx.length === 0) return;
    users++;
    totalTx += tx.length;
    let reasoned = 0, reasonLens = [];

    tx.forEach(t => {
      Object.keys(t).forEach(k => {
        if (!BASE.has(k)) {
          const v = t[k];
          if (typeof v === "string" && v.trim().length > 0) {
            extraFieldCount[k] = (extraFieldCount[k] || 0) + 1;
            reasoned++;
            reasonLens.push(v.trim().length);
          }
        }
      });
    });

    perUser.push({
      school: d.school?.name || "-",
      tx: tx.length,
      reasoned,
      rate: (reasoned / tx.length * 100).toFixed(1) + "%",
      avgLen: reasonLens.length ? Math.round(reasonLens.reduce((a,b)=>a+b,0)/reasonLens.length) : 0,
    });
  });

  console.log("=== 이유 필드 자동 탐지 ===");
  console.log(extraFieldCount);
  console.log("\n=== 전체 집계 ===");
  console.log("거래 보유 유저:", users, "/ 전체 거래:", totalTx);
  const totalReasoned = perUser.reduce((a,u)=>a+u.reasoned,0);
  console.log("이유 기록 거래:", totalReasoned, "/ 이유 기록률:", (totalReasoned/totalTx*100).toFixed(1)+"%");
  console.log("\n=== 유저별 ===");
  console.table(perUser.sort((a,b)=>b.tx-a.tx));
})();
