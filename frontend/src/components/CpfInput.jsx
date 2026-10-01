import { useState } from 'react';
import { cleanCpf, isValidCpf, maskCpf } from '../cpf';

// Masked CPF field. It checks the CPF as soon as the 11th digit is typed (and on blur),
// showing ✓ valid / ✗ invalid. `locked` shows a read-only CPF with a padlock.
export default function CpfInput({ value, onChange, label = 'CPF', locked = false, required = true, hint, className = 'field' }) {
  const [touched, setTouched] = useState(false);
  const digits = cleanCpf(value);
  const complete = digits.length === 11;
  const show = !locked && (complete || (touched && digits.length > 0));
  const valid = isValidCpf(digits);

  return (
    <label className={`${className} cpf`}>
      {label}
      <span className="cpf__wrap">
        <input
          className={`input ${show ? (valid ? 'input--ok' : 'input--bad') : ''}`}
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          value={maskCpf(value)}
          onChange={(e) => onChange(cleanCpf(e.target.value))}
          onBlur={() => setTouched(true)}
          required={required}
          disabled={locked}
          aria-invalid={show && !valid}
        />
        {locked && <span className="cpf__lock" aria-hidden>🔒</span>}
      </span>
      {show && (
        <small className={valid ? 'cpf__msg cpf__msg--ok' : 'cpf__msg cpf__msg--bad'} role="status">
          {valid ? '✓ CPF válido' : complete ? '✗ CPF inválido — confira os números' : '✗ CPF incompleto'}
        </small>
      )}
      {hint && !show && <small className="muted">{hint}</small>}
    </label>
  );
}
