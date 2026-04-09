export default function SpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-6">
      <div className="text-center space-y-6">
        <div className="text-6xl">📱</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-snug">
          スマホ版 TebikiChart
        </h1>
        <p className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
          乞うご期待！
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          現在、PC版のみご利用いただけます。
        </p>
      </div>
    </div>
  )
}
