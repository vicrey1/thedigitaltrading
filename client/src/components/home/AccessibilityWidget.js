import React, { useState } from 'react';

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [contrast, setContrast] = useState(false);
  React.useEffect(() => {
    document.body.style.fontSize = fontSize + 'em';
    document.body.style.filter = contrast ? 'contrast(1.2)' : '';
    return () => {
      document.body.style.fontSize = '';
      document.body.style.filter = '';
    };
  }, [fontSize, contrast]);
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button onClick={() => setOpen(o => !o)} className="bg-black bg-opacity-80 border border-gold/40 rounded-full w-12 h-12 flex items-center justify-center text-gold text-2xl shadow-lg focus:outline-none">
        <span role="img" aria-label="accessibility">♿</span>
      </button>
      {open && (
        <div className="mt-2 bg-black bg-opacity-90 border border-gold/30 rounded-xl p-4 shadow-xl flex flex-col gap-3 min-w-[180px]">
          <button onClick={() => setFontSize(f => Math.max(0.8, f - 0.1))} className="text-white bg-gold/10 rounded px-2 py-1">A-</button>
          <button onClick={() => setFontSize(f => Math.min(1.5, f + 0.1))} className="text-white bg-gold/10 rounded px-2 py-1">A+</button>
          <button onClick={() => setContrast(c => !c)} className="text-white bg-gold/10 rounded px-2 py-1">{contrast ? 'Normal Contrast' : 'High Contrast'}</button>
        </div>
      )}
    </div>
  );
}
