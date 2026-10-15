const THEMES = {
  emerald: {
    background: 'from-slate-900 via-emerald-950 to-slate-900',
    spinner: 'border-emerald-400',
    text: 'text-emerald-300',
  },
  purple: {
    background: 'from-slate-900 via-purple-950 to-slate-900',
    spinner: 'border-purple-400',
    text: 'text-purple-300',
  },
};

export function LoadingScreen({ theme = 'emerald' }) {
  const t = THEMES[theme];
  return (
    <div className={`min-h-screen bg-gradient-to-br ${t.background} flex items-center justify-center`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full h-14 w-14 border-4 ${t.spinner} border-t-transparent mx-auto mb-4`}></div>
        <p className={t.text}>Loading players…</p>
      </div>
    </div>
  );
}

export function ErrorScreen({ message, theme = 'emerald' }) {
  const t = THEMES[theme];
  return (
    <div className={`min-h-screen bg-gradient-to-br ${t.background} flex items-center justify-center p-4`}>
      <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-8 max-w-lg text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-300 mb-4">Firebase Connection Error</h2>
        <p className="text-red-200 mb-4 break-words">{message}</p>
        <div className="text-left bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300">
          <p className="font-bold mb-2">To fix this:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to Firebase Console</li>
            <li>Click on Firestore Database</li>
            <li>Create database (if not created)</li>
            <li>Start in test mode</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
