import { useRef, useState } from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import { FaRegTrashCan } from 'react-icons/fa6';

// Resize + compress to a data URL so it fits comfortably in localStorage.
async function fileToDataUrl(file, maxW = 800) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, maxW / img.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

export default function ImageDrop({ value, onChange }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState('');

  const handleFiles = async (files) => {
    const file = files && files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('That is not an image file.'); return; }
    setErr('');
    try { onChange(await fileToDataUrl(file)); }
    catch { setErr('Could not read that image.'); }
  };

  if (value) {
    return (
      <div className="flex items-center gap-3">
        <img src={value} alt="" className="h-16 w-20 rounded-lg object-cover" />
        <button type="button"
                className="rounded-lg border border-[#e9dfcf] bg-white px-3 py-1.5 text-[13px] font-semibold"
                onClick={() => inputRef.current?.click()}>
          Replace
        </button>
        <button type="button" aria-label="Remove photo"
                className="flex items-center gap-1.5 rounded-lg border border-[#ecc5be] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#b9382b]"
                onClick={() => onChange('')}>
          <FaRegTrashCan /> Remove
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
               onChange={(e) => handleFiles(e.target.files)} />
      </div>
    );
  }

  return (
    <div>
      <div role="button" tabIndex={0}
           className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
             over ? 'border-[#cd5825] bg-[#faecd9]' : 'border-[#e9dfcf] bg-[#fdf9f1]'
           }`}
           onClick={() => inputRef.current?.click()}
           onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
           onDragOver={(e) => { e.preventDefault(); setOver(true); }}
           onDragLeave={() => setOver(false)}
           onDrop={(e) => { e.preventDefault(); setOver(false); handleFiles(e.dataTransfer.files); }}>
        <FiUploadCloud className={`text-2xl ${over ? 'text-[#cd5825]' : 'text-[#8e8374]'}`} />
        <span className="text-[13px] font-semibold text-[#6d6253]">
          Drop a photo here, or click to browse
        </span>
        <span className="text-xs text-[#8e8374]">JPG or PNG, resized automatically</span>
      </div>
      {err && <p className="mt-1.5 text-[13px] font-medium text-[#b9382b]">{err}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
             onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}
