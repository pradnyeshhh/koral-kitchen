export default function Qty({ value, onChange }) {
  return (
    <div className="qty">
      <button aria-label="Remove one" onClick={() => onChange(value - 1)}>−</button>
      <span>{value}</span>
      <button aria-label="Add one" onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}
