// Looks up an address from a CEP using the free ViaCEP service.
// Returns { address, city, state } or null (bad CEP / offline — the user just types it).
export async function lookupCep(cep) {
  const digits = String(cep).replace(/\D/g, '');
  if (digits.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`).then((r) => r.json());
    if (r.erro) return null;
    return { address: r.logradouro, city: r.localidade, state: r.uf };
  } catch {
    return null;
  }
}
