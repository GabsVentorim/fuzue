// CPF helpers — same rules as backend/src/util.js (the server always re-validates).
export const cleanCpf = (v) => String(v || '').replace(/\D/g, '').slice(0, 11);

// 52998224725 → 529.982.247-25 (also formats partial input while typing)
export const maskCpf = (v) =>
  cleanCpf(v)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');

export function isValidCpf(v) {
  const d = cleanCpf(v);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digit = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digit(9) === Number(d[9]) && digit(10) === Number(d[10]);
}
