export default function SpPage() {
  const tutorials = [
    {
      href: '/mynumber-tutorial.html',
      emoji: '🪪',
      title: 'マイナンバーカード申請',
      description: 'マイナンバーカードの申請手順をステップごとに案内します',
    },
    {
      href: '/kakuteishinkoku-tutorial.html',
      emoji: '📝',
      title: '確定申告',
      description: '確定申告の流れをわかりやすく解説します',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-5 py-10">
      <div className="max-w-lg mx-auto space-y-8">

        {/* ヘッダー */}
        <div className="text-center space-y-2">
          <div className="text-5xl">📱</div>
          <h1 className="text-2xl font-bold text-gray-800">TebikiChart</h1>
          <p className="text-sm text-gray-500">複雑な手続きをわかりやすく案内するチュートリアルツール</p>
        </div>

        {/* 活用例リスト */}
        <div>
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-3">活用例</p>
          <div className="space-y-3">
            {tutorials.map((t) => (
              <a
                key={t.href}
                href={t.href}
                className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm active:scale-95 transition-transform"
              >
                <span className="text-3xl flex-shrink-0">{t.emoji}</span>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-800 text-sm">{t.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-snug">{t.description}</div>
                </div>
                <span className="ml-auto text-gray-300 flex-shrink-0">›</span>
              </a>
            ))}
          </div>
        </div>

        {/* フッター */}
        <p className="text-center text-xs text-gray-400">PC版ではシナリオの作成・編集ができます</p>
      </div>
    </div>
  )
}
