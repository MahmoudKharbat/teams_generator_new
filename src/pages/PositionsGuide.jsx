import { Link } from 'react-router-dom';
import { POSITIONS, STATS } from '../lib/playerRating';
import AppFooter from '../components/AppFooter';

// Arabic guide to the player positions and how each one's overall is calculated.
// The stat weights come from playerRating.js, so this page always matches the real formula.

const STAT_NAMES_AR = {
  pac: 'السرعة',
  sho: 'التسديد',
  pas: 'التمرير',
  dri: 'المراوغة',
  def: 'الدفاع',
  phy: 'القوة البدنية',
};

const GROUPS_AR = {
  Goalkeeper: { name: 'حراسة المرمى', color: 'bg-amber-500 text-slate-900', ring: 'border-amber-500/40', bar: 'bg-amber-400' },
  Defence: { name: 'الدفاع', color: 'bg-sky-500 text-slate-900', ring: 'border-sky-500/40', bar: 'bg-sky-400' },
  Midfield: { name: 'خط الوسط', color: 'bg-emerald-500 text-slate-900', ring: 'border-emerald-500/40', bar: 'bg-emerald-400' },
  Attack: { name: 'الهجوم', color: 'bg-rose-500 text-white', ring: 'border-rose-500/40', bar: 'bg-rose-400' },
};

// x/y in % of the pitch; the team attacks upwards, so left and right are as seen by the players.
const POSITIONS_AR = {
  GK: {
    name: 'حارس المرمى',
    x: 50, y: 91,
    role: 'آخر خط في الفريق. يتصدى للتسديدات ويحمي المرمى، وهو اللاعب الوحيد المسموح له بلمس الكرة بيده داخل منطقة الجزاء. يبدأ الهجمة بتمريرة أو ركلة طويلة.',
  },
  CB: {
    name: 'قلب الدفاع',
    x: 50, y: 76,
    role: 'يقف في وسط خط الدفاع أمام الحارس. يراقب المهاجمين ويقطع الكرات ويفوز بالكرات الهوائية، ومهمته الأولى منع الخصم من الوصول إلى المرمى.',
  },
  LB: {
    name: 'الظهير الأيسر',
    x: 14, y: 70,
    role: 'مدافع على الجهة اليسرى. يراقب جناح الخصم، ويتقدم على الطرف لمساندة الهجوم وإرسال الكرات العرضية.',
  },
  RB: {
    name: 'الظهير الأيمن',
    x: 86, y: 70,
    role: 'مدافع على الجهة اليمنى. يراقب جناح الخصم، ويتقدم على الطرف لمساندة الهجوم وإرسال الكرات العرضية.',
  },
  CDM: {
    name: 'لاعب الوسط المدافع (الارتكاز)',
    x: 50, y: 60,
    role: 'يقف أمام خط الدفاع مباشرة. يقطع هجمات الخصم قبل أن تصل للدفاع، ويبدأ بناء اللعب بتمريرات آمنة.',
  },
  CM: {
    name: 'لاعب الوسط',
    x: 50, y: 46,
    role: 'يربط الدفاع بالهجوم. يوزّع اللعب بالتمرير، ويشارك في الدفاع والهجوم معاً، ويحتاج لياقة عالية.',
  },
  CAM: {
    name: 'صانع الألعاب (لاعب الوسط المهاجم)',
    x: 50, y: 31,
    role: 'يلعب خلف المهاجمين مباشرة. يصنع الفرص بالتمريرات الحاسمة والمراوغة، ويسدد من خارج منطقة الجزاء.',
  },
  LM: {
    name: 'لاعب الوسط الأيسر',
    x: 13, y: 44,
    role: 'يتحرك على الجهة اليسرى من خط الوسط. يساند الظهير في الدفاع، ويرسل العرضيات ويخترق في الهجوم.',
  },
  RM: {
    name: 'لاعب الوسط الأيمن',
    x: 87, y: 44,
    role: 'يتحرك على الجهة اليمنى من خط الوسط. يساند الظهير في الدفاع، ويرسل العرضيات ويخترق في الهجوم.',
  },
  LW: {
    name: 'الجناح الأيسر',
    x: 17, y: 20,
    role: 'مهاجم على الطرف الأيسر، سريع ومراوغ. يتجاوز المدافعين ويخترق نحو المرمى أو يرسل العرضيات للمهاجم.',
  },
  RW: {
    name: 'الجناح الأيمن',
    x: 83, y: 20,
    role: 'مهاجم على الطرف الأيمن، سريع ومراوغ. يتجاوز المدافعين ويخترق نحو المرمى أو يرسل العرضيات للمهاجم.',
  },
  ST: {
    name: 'رأس الحربة (المهاجم)',
    x: 50, y: 11,
    role: 'أقرب لاعب إلى مرمى الخصم. مهمته الأولى تسجيل الأهداف: يتمركز داخل المنطقة، ويسدد، ويلعب الكرات الرأسية.',
  },
};

const GK_HINT_AR =
  'الحارس يُقيَّم بنفس الإحصائيات الست: الدفاع = التصدي للكرات، المراوغة = ردة الفعل، التمرير = توزيع الكرة، القوة البدنية = السيطرة على منطقة الجزاء.';

const scrollToPosition = (code) =>
  document.getElementById(`pos-${code}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

function Pitch() {
  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-700 to-emerald-800 border-2 border-white/30">
      {/* Pitch markings (direction-independent, so this stays correct inside the RTL page) */}
      <svg dir="ltr" viewBox="0 0 100 150" className="absolute inset-0 w-full h-full" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <rect key={i} x="0" y={i * 25} width="100" height="12.5" fill="white" opacity="0.04" />
        ))}
        <g fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="0.6">
          <line x1="0" y1="75" x2="100" y2="75" />
          <circle cx="50" cy="75" r="11" />
          <rect x="20" y="0" width="60" height="20" />
          <rect x="36" y="0" width="28" height="7" />
          <rect x="20" y="130" width="60" height="20" />
          <rect x="36" y="143" width="28" height="7" />
        </g>
      </svg>
      <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[10px] text-white/70">مرمى الخصم ↑</span>
      {POSITIONS.map((p) => {
        const ar = POSITIONS_AR[p.code];
        return (
          <button
            key={p.code}
            type="button"
            onClick={() => scrollToPosition(p.code)}
            title={ar.name}
            style={{ left: `${ar.x}%`, top: `${ar.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full text-xs font-black shadow-lg ring-2 ring-white/70 hover:scale-110 transition-transform ${GROUPS_AR[p.group].color}`}
          >
            {p.code}
          </button>
        );
      })}
    </div>
  );
}

function PositionCard({ position }) {
  const ar = POSITIONS_AR[position.code];
  const group = GROUPS_AR[position.group];
  const weights = STATS.filter(({ key }) => position.weights[key]).sort(
    (a, b) => position.weights[b.key] - position.weights[a.key]
  );
  return (
    <article id={`pos-${position.code}`} className={`scroll-mt-6 bg-slate-800/50 border ${group.ring} rounded-2xl p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <span dir="ltr" className={`shrink-0 w-14 h-10 rounded-lg flex items-center justify-center font-black ${group.color}`}>
          {position.code}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white leading-tight">{ar.name}</h3>
          <p dir="ltr" className="text-slate-500 text-xs text-right">{position.name}</p>
        </div>
      </div>
      <p className="text-slate-300 leading-relaxed mb-4">{ar.role}</p>
      {position.code === 'GK' && <p className="text-amber-200/80 text-sm leading-relaxed mb-4">{GK_HINT_AR}</p>}
      <p className="text-slate-400 text-sm mb-2">نسبة كل إحصائية في حساب القوة:</p>
      <ul className="space-y-1.5">
        {weights.map(({ key, label }) => (
          <li key={key} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2 text-sm">
            <span className="text-slate-200">
              {STAT_NAMES_AR[key]} <span dir="ltr" className="text-slate-500 text-xs">{label}</span>
            </span>
            <span className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <span className={`block h-full rounded-full ${group.bar}`} style={{ width: `${position.weights[key]}%` }}></span>
            </span>
            <span dir="ltr" className="text-slate-300 font-semibold text-left">{position.weights[key]}%</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function PositionsGuide() {
  const groups = Object.keys(GROUPS_AR);
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-4 py-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div className="text-center sm:text-right">
            <h1 className="text-3xl sm:text-4xl font-black text-white">📖 شرح مراكز اللاعبين</h1>
            <p className="text-emerald-200/60 mt-2">ماذا يعني كل مركز، وكيف تُحسب قوة اللاعب فيه</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-emerald-300 rounded-xl font-semibold border border-emerald-500/30"
            >
              ⚽ توزيع الفرق
            </Link>
            <Link
              to="/admin"
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-purple-300 rounded-xl font-semibold border border-purple-500/30"
            >
              ⚙️ إدارة اللاعبين
            </Link>
          </div>
        </header>

        <section className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 mb-8 leading-relaxed text-slate-300">
          <h2 className="text-xl font-bold text-white mb-2">كيف تُحسب القوة؟</h2>
          <p>
            لكل لاعب مركز وست إحصائيات من 1 إلى 99. القوة (التقييم العام) هي متوسط مرجّح لهذه الإحصائيات، والأوزان تختلف حسب
            المركز: التسديد مهم جداً للمهاجم، والدفاع مهم جداً لقلب الدفاع. لاعب كل إحصائياته 70 تكون قوته 70 في أي مركز.
          </p>
          <ul className="flex flex-wrap gap-2 mt-4">
            {STATS.map(({ key, label }) => (
              <li key={key} className="px-3 py-1.5 bg-slate-900/60 rounded-lg text-sm">
                <span dir="ltr" className="font-bold text-emerald-300">{label}</span>{' '}
                <span className="text-slate-200">{STAT_NAMES_AR[key]}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid lg:grid-cols-[22rem_1fr] gap-8 items-start">
          <aside className="lg:sticky lg:top-6">
            <Pitch />
            <p className="text-slate-400 text-sm text-center mt-3">اضغط على أي مركز لقراءة شرحه</p>
            <ul className="flex flex-wrap justify-center gap-3 mt-3 text-xs text-slate-300">
              {groups.map((g) => (
                <li key={g} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-full ${GROUPS_AR[g].color}`}></span>
                  {GROUPS_AR[g].name}
                </li>
              ))}
            </ul>
          </aside>

          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g}>
                <h2 className="text-2xl font-black text-white mb-4">{GROUPS_AR[g].name}</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {POSITIONS.filter((p) => p.group === g).map((p) => (
                    <PositionCard key={p.code} position={p} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
        <AppFooter />
      </div>
    </div>
  );
}
