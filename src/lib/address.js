// Structured "Other" address helpers shared by checkout and the admin forms.

export function composeAddress(f) {
  let a = `${f.flat_no.trim()}, ${f.building.trim()}, ${f.street.trim()}`;
  if (f.landmark.trim()) a += `, ${f.landmark.trim()}`;
  if (f.pincode.trim()) a += `, ${f.pincode.trim()}`;
  return a;
}

// Best-effort split of a stored one-line address back into parts,
// for records that predate the structured fields.
export function parseAddress(full = '') {
  const out = { flat_no: '', building: '', street: '', landmark: '', pincode: '' };
  const parts = (full || '').split(',').map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return out;
  if (/^\d{6}$/.test(parts[parts.length - 1])) out.pincode = parts.pop();
  out.flat_no = parts.shift() || '';
  out.building = parts.shift() || '';
  out.street = parts.join(', ');
  return out;
}

export function addressParts(c) {
  if (c && c.flat_no) {
    return {
      flat_no: c.flat_no || '', building: c.building || '', street: c.street || '',
      landmark: c.landmark || '', pincode: c.pincode || '',
    };
  }
  return parseAddress(c && c.full_address);
}
