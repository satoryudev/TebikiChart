'use client';

import { useEffect, useState } from 'react';

export default function EmptyStatePrompt() {
  const [bounce, setBounce] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBounce(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleClick = () => {
    document.dispatchEvent(new CustomEvent('govguide:focus-palette'));
  };

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center flex flex-col items-center">
      <div className={`text-4xl mb-4 ${bounce ? 'animate-bounce' : ''}`}>📋</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">まだブロックがありません</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        左のパレットからブロックを追加して、シナリオを作り始めましょう。
      </p>
      <button
        onClick={handleClick}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          flex items-center gap-2"
      >
        <span>+</span>
        最初のブロックを追加する
      </button>
    </div>
  );
}
