const B="https://sana-rho-ten.vercel.app";
let cookie="";
const lr=await fetch(B+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"ceo@demo.kz",password:"demo123"})});
cookie=(lr.headers.getSetCookie?.()??[]).map(c=>c.split(";")[0]).join("; ");
async function ask(q){const r=await fetch(B+"/api/ask",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({question:q,pack:"auto"})});return r.json();}
const conv="Слушай, а какой дилер у нас хуже всех просел этой весной и почему так вышло?";
const a=await ask(conv);
console.log("CONVERSATIONAL:");
console.log("  engine:", a.engine, "| intent:", a.plan?.intent, "| dims:", JSON.stringify(a.plan?.dimensions), "| sort:", JSON.stringify(a.plan?.sort), "| rows:", a.rowCount);
console.log("  вывод:", (a.insight?.summary||a.clarify||"").slice(0,160));
