export const waNum = (p) => { const d = (p || "").replace(/\D/g, ""); return d.startsWith("0") ? "44" + d.slice(1) : d; };
export const waTo = (phone, text) => `https://wa.me/${waNum(phone)}?text=${encodeURIComponent(text)}`;
