"use client";

export interface DigitFormatBuilderProps {
  value: string;
  onChange: (value: string) => void;
}

export function DigitFormatBuilder({ value, onChange }: DigitFormatBuilderProps) {
  // Parse format into blocks
  const parseFormatToBlocks = (format: string): { type: 'digit' | 'letter' | 'separator'; char: string }[] => {
    if (!format) return [];
    return format.split('').map(char => {
      if (char === 'X' || char === 'x') return { type: 'digit' as const, char: 'X' };
      if (char === 'A' || char === 'a') return { type: 'letter' as const, char: 'A' };
      return { type: 'separator' as const, char };
    });
  };

  const blocks = parseFormatToBlocks(value);

  const addBlock = (type: 'digit' | 'letter' | 'separator', char?: string) => {
    const newChar = type === 'digit' ? 'X' : type === 'letter' ? 'A' : (char || '-');
    onChange(value + newChar);
  };

  const removeBlock = (index: number) => {
    const newValue = value.slice(0, index) + value.slice(index + 1);
    onChange(newValue);
  };

  const clearAll = () => {
    onChange('');
  };

  // Quick templates
  const applyTemplate = (template: string) => {
    onChange(template);
  };

  return (
    <div className="space-y-3">
      {/* Visual blocks display */}
      <div className="flex flex-wrap items-center gap-1 min-h-[44px] p-2 bg-white border border-amber-300 rounded-lg">
        {blocks.length === 0 ? (
          <span className="text-gray-400 text-sm">คลิกปุ่มด้านล่างเพื่อเพิ่ม</span>
        ) : (
          blocks.map((block, idx) => (
            <div
              key={idx}
              onClick={() => removeBlock(idx)}
              className={`
                relative group cursor-pointer transition-all
                ${block.type === 'digit'
                  ? 'w-8 h-9 bg-blue-100 border-2 border-blue-300 rounded-md flex items-center justify-center text-blue-700 font-mono font-bold hover:bg-blue-200'
                  : block.type === 'letter'
                  ? 'w-8 h-9 bg-green-100 border-2 border-green-300 rounded-md flex items-center justify-center text-green-700 font-mono font-bold hover:bg-green-200'
                  : 'px-1 h-9 flex items-center justify-center text-gray-500 font-bold text-lg hover:bg-gray-100 rounded'
                }
              `}
              title="คลิกเพื่อลบ"
            >
              {block.type === 'digit' ? '0' : block.type === 'letter' ? 'A' : block.char}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                ×
              </span>
            </div>
          ))
        )}
      </div>

      {/* Add buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addBlock('digit')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          <span className="w-5 h-5 bg-blue-200 rounded flex items-center justify-center text-xs font-bold">0</span>
          เลข
        </button>
        <button
          type="button"
          onClick={() => addBlock('letter')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
        >
          <span className="w-5 h-5 bg-green-200 rounded flex items-center justify-center text-xs font-bold">A</span>
          ตัวอักษร
        </button>
        <button
          type="button"
          onClick={() => addBlock('separator', '-')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          <span className="font-bold">-</span>
          ขีด
        </button>
        <button
          type="button"
          onClick={() => addBlock('separator', '/')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          <span className="font-bold">/</span>
          ทับ
        </button>
        <button
          type="button"
          onClick={() => addBlock('separator', ' ')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          <span className="w-4 h-4 border border-dashed border-gray-400 rounded"></span>
          เว้นวรรค
        </button>
        {blocks.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors ml-auto"
          >
            ล้างทั้งหมด
          </button>
        )}
      </div>

      {/* Quick templates */}
      <div className="pt-2 border-t border-amber-200">
        <p className="text-xs text-amber-700 mb-2">ตัวอย่างรูปแบบ:</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyTemplate('XXXXXX')}
            className="px-2 py-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 rounded transition-colors"
          >
            OTP 6 หลัก
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('AA-X-XXX-XXXX')}
            className="px-2 py-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 rounded transition-colors"
          >
            ทะเบียนรถ
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('X-XXXX-XXXXX-XX-X')}
            className="px-2 py-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 rounded transition-colors"
          >
            บัตรประชาชน
          </button>
          <button
            type="button"
            onClick={() => applyTemplate('XXXX-XXXX-XXXX-XXXX')}
            className="px-2 py-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 rounded transition-colors"
          >
            บัตรเครดิต
          </button>
        </div>
      </div>

      {/* Result preview */}
      <div className="text-xs text-amber-600">
        รูปแบบ: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">{value || '(ว่าง)'}</code>
      </div>
    </div>
  );
}
