import { Link } from "react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Languages,
  Layers,
  LockKeyhole,
  School,
  Timer,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { LangToggle, useNum, useT } from "@/lib/lang";
import { DEFAULT_SETTINGS } from "@/lib/api";
import HeroIllustration from "./HeroIllustration";

export default function Welcome() {
  const t = useT();
  const num = useNum();
  const school = DEFAULT_SETTINGS;

  const stats = [
    { value: `${num("2,320")}+`, label: t("मराठी माध्यमातील प्रश्न", "Questions in Marathi") },
    { value: num(20), label: t("तयार सराव प्रश्नपत्रिका", "Ready-made mock tests") },
    { value: num(32), label: t("घटक व उपघटक", "Topics covered") },
    { value: num(3), label: t("काठिण्य पातळ्या", "Difficulty levels") },
  ];

  const sections = [
    {
      icon: Layers,
      name: t("बुद्धिमत्ता चाचणी", "Mental Ability Test"),
      q: 40, m: 50, d: 60,
      desc: t(
        "विसंगत आकृती, आकृती मालिका, सादृश्यता, आरशातील प्रतिमा, कागद दुमडणे, लपलेली आकृती इत्यादी १० प्रकार.",
        "Ten figure-based sections: odd man out, series, analogy, mirror images, punched holes, embedded figures and more.",
      ),
      tone: "from-blue-600 to-indigo-600",
    },
    {
      icon: BarChart3,
      name: t("अंकगणित चाचणी", "Arithmetic Test"),
      q: 20, m: 25, d: 30,
      desc: t(
        "संख्याज्ञान, अपूर्णांक, दशांश, ल.सा.वि.-म.सा.वि., शेकडेवारी, नफा-तोटा, सरळव्याज, मापन, क्षेत्रफळ.",
        "Numbers, fractions, decimals, LCM-HCF, percentage, profit & loss, simple interest, measurement, area.",
      ),
      tone: "from-emerald-600 to-teal-600",
    },
    {
      icon: Languages,
      name: t("भाषा चाचणी", "Language Test"),
      q: 20, m: 25, d: 30,
      desc: t(
        "मराठी उतारे वाचून आकलन, शब्दार्थ, अनुमान व व्याकरण यांवर आधारित प्रश्न.",
        "Marathi reading passages with questions on comprehension, word meaning, inference and grammar.",
      ),
      tone: "from-amber-500 to-orange-600",
    },
  ];

  const studentFeatures = [
    { icon: BookOpenCheck, title: t("विषय व घटकनिहाय सराव", "Topic-wise practice"), body: t("सोपे, मध्यम व कठीण प्रश्न; प्रत्येक उत्तरानंतर लगेच स्पष्टीकरण.", "Easy, medium and hard questions with an explanation after every answer.") },
    { icon: Timer, title: t("खऱ्या परीक्षेसारख्या सराव परीक्षा", "Real exam experience"), body: t("८० प्रश्न, १२० मिनिटे, प्रश्न क्रमांक पट्टी व आपोआप जतन होणारी उत्तरे.", "80 questions in 120 minutes with a question palette and auto-saved answers.") },
    { icon: Trophy, title: t("निकाल व प्रगती", "Results and progress"), body: t("विषयवार गुण, उत्तरांची तपासणी आणि कोणत्या घटकांचा सराव हवा ते लगेच कळते.", "Section-wise marks, answer review and a clear view of topics that need practice.") },
  ];

  const teacherFeatures = [
    { icon: UserPlus, title: t("विद्यार्थ्यांची खाती", "Student accounts"), body: t("हजेरी क्रमांकावर आधारित सोपे लॉगिन; पासवर्ड शिक्षक बदलू शकतात.", "Simple roll-number login; passwords managed by the teacher.") },
    { icon: CalendarClock, title: t("वेळेवर आपोआप सुरू होणाऱ्या परीक्षा", "Auto-scheduled tests"), body: t("ठरलेल्या वेळी परीक्षा सुरू व बंद होते; न सबमिट केलेले पेपर आपोआप तपासले जातात.", "Tests open and close on time; unsubmitted papers are graded automatically.") },
    { icon: ClipboardCheck, title: t("गुणवत्ता यादी व अहवाल", "Merit lists and reports"), body: t("गुणवत्ता यादीची PDF, विषयवार विश्लेषण आणि Excel अहवाल.", "Merit list PDF, subject and topic analysis, Excel reports.") },
    { icon: Users, title: t("विद्यार्थ्यांच्या सरावाचा मागोवा", "Practice tracking"), body: t("कोण नियमित सराव करतो, कोणाला प्रोत्साहनाची गरज आहे ते एका नजरेत.", "See who practises regularly and who needs encouragement.") },
  ];

  const steps = [
    { title: t("शिक्षक खाते तयार करतात", "Teacher creates accounts"), body: t("प्रत्येक विद्यार्थ्याला हजेरी क्रमांक व पासवर्ड मिळतो.", "Each student receives a roll number and password.") },
    { title: t("विद्यार्थी रोज सराव करतात", "Students practise daily"), body: t("घटकनिहाय प्रश्न सोडवून स्पष्टीकरणातून शिकतात.", "They solve topic-wise questions and learn from explanations.") },
    { title: t("सराव परीक्षा", "Mock tests"), body: t("ठरलेल्या वेळी पूर्ण नवोदय पद्धतीची परीक्षा.", "Full JNVST-pattern papers at the scheduled time.") },
    { title: t("निकाल व मार्गदर्शन", "Results and guidance"), body: t("गुण, गुणवत्ता यादी व कमकुवत घटकांवर पुढील सराव.", "Scores, merit lists and focused practice on weak topics.") },
  ];

  return (
    <div className="min-h-full overflow-x-hidden bg-white text-ink">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm">
              <GraduationCap className="size-5" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-bold text-brand-900">{t("नवोदय प्रवेश तयारी", "Navodaya Prep")}</span>
              <span className="block truncate text-[11px] font-medium text-slate-500">{school.school_name}</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <LangToggle className="hidden sm:inline-flex" />
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800"
            >
              <LockKeyhole className="size-4" /> {t("लॉगिन", "Login")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-brand-100/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-xs">
              <School className="size-3.5" /> {t("जवाहर नवोदय विद्यालय प्रवेश परीक्षा (इयत्ता ६)", "Jawahar Navodaya Vidyalaya Selection Test (Class 6)")}
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-brand-900 sm:text-4xl lg:text-5xl">
              {t("इयत्ता ५ च्या विद्यार्थ्यांसाठी नवोदय परीक्षेची संपूर्ण तयारी", "Complete JNVST preparation for Class 5 students")}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              {t(
                "मराठी माध्यमातील हजारो प्रश्न, खऱ्या परीक्षेसारख्या सराव परीक्षा आणि शिक्षकांसाठी प्रगतीचा अचूक मागोवा — एकाच ठिकाणी.",
                "Thousands of Marathi-medium questions, real exam-style mock tests and accurate progress tracking for teachers — all in one place.",
              )}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-800"
              >
                {t("विद्यार्थी लॉगिन", "Student login")} <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                {t("शिक्षक लॉगिन", "Teacher login")}
              </Link>
            </div>
            <ul className="mt-7 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              {[
                t("अधिकृत नवोदय परीक्षा पद्धतीनुसार", "Follows the official JNVST pattern"),
                t("चुकीच्या उत्तराला गुण कापले जात नाहीत", "No negative marking, as in JNVST"),
                t("प्रत्येक प्रश्नासाठी स्पष्टीकरण", "Explanation for every question"),
                t("मोबाईल व संगणकावर चालते", "Works on mobile and computer"),
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-md md:max-w-none">
            <HeroIllustration className="h-auto w-full" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white px-4 py-6 text-center">
              <p className="text-2xl font-extrabold text-brand-800 sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Exam pattern */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{t("परीक्षेचे स्वरूप", "Exam pattern")}</p>
          <h2 className="mt-2 text-2xl font-bold text-brand-900 sm:text-3xl">
            {t("८० प्रश्न · १०० गुण · २ तास", "80 questions · 100 marks · 2 hours")}
          </h2>
          <p className="mt-3 text-slate-600">
            {t("नवोदय प्रवेश परीक्षेत तीन विभाग असतात. आमचा सराव याच रचनेवर आधारित आहे.", "The selection test has three sections. All practice on this platform follows the same structure.")}
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {sections.map((s) => (
            <div key={s.name} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-shadow hover:shadow-md">
              <div className={`flex items-center gap-3 bg-gradient-to-r ${s.tone} px-5 py-4 text-white`}>
                <s.icon className="size-6" />
                <h3 className="text-lg font-bold">{s.name}</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    [num(s.q), t("प्रश्न", "Questions")],
                    [num(s.m), t("गुण", "Marks")],
                    [num(s.d), t("मिनिटे", "Minutes")],
                  ].map(([v, l]) => (
                    <div key={l} className="rounded-xl bg-slate-50 py-2.5">
                      <p className="text-xl font-extrabold text-ink">{v}</p>
                      <p className="text-[11px] font-medium text-slate-500">{l}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About JNV */}
      <section className="bg-brand-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-5 md:items-center">
          <div className="md:col-span-3">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-200">{t("नवोदय विद्यालयाविषयी", "About Navodaya Vidyalayas")}</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{t("ग्रामीण प्रतिभेला उत्तम शिक्षणाची संधी", "Quality education for talented rural children")}</h2>
            <p className="mt-4 leading-relaxed text-brand-100">
              {t(
                "जवाहर नवोदय विद्यालये ही नवोदय विद्यालय समितीमार्फत चालवली जाणारी निवासी शाळा आहेत. इयत्ता ६ मधील प्रवेश इयत्ता ५ च्या विद्यार्थ्यांसाठी घेतल्या जाणाऱ्या निवड चाचणीतून होतो. किमान ७५% जागा ग्रामीण भागातील विद्यार्थ्यांसाठी राखीव असतात.",
                "Jawahar Navodaya Vidyalayas are residential schools run by the Navodaya Vidyalaya Samiti. Admission to Class 6 is through a selection test taken by Class 5 students, and at least 75% of seats are reserved for children from rural areas.",
              )}
            </p>
          </div>
          <div className="grid gap-3 md:col-span-2">
            {[
              [t("निवासी शाळा", "Residential schools"), t("राहणे, भोजन व शिक्षण एकाच ठिकाणी", "Boarding, lodging and schooling together")],
              [t("ग्रामीण विद्यार्थ्यांना प्राधान्य", "Priority for rural students"), t("किमान ७५% जागा ग्रामीण भागासाठी", "At least 75% of seats for rural areas")],
              [t("इयत्ता ६ ते १२", "Classes 6 to 12"), t("सीबीएसई अभ्यासक्रम", "CBSE curriculum")],
            ].map(([a, b]) => (
              <div key={a} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                <p className="font-semibold">{a}</p>
                <p className="text-sm text-brand-200">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{t("विद्यार्थ्यांसाठी", "For students")}</p>
            <h2 className="mt-2 text-2xl font-bold text-brand-900">{t("रोज थोडा सराव, मोठे यश", "A little practice every day")}</h2>
            <div className="mt-6 space-y-4">
              {studentFeatures.map((f) => (
                <div key={f.title} className="flex gap-4 rounded-2xl border border-slate-200 p-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <f.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">{t("शिक्षकांसाठी", "For teachers")}</p>
            <h2 className="mt-2 text-2xl font-bold text-brand-900">{t("संपूर्ण वर्गाचे नियोजन एका ठिकाणी", "Manage the whole class in one place")}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {teacherFeatures.map((f) => (
                <div key={f.title} className="rounded-2xl border border-slate-200 p-4">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-3 font-semibold text-ink">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-brand-900 sm:text-3xl">{t("हे कसे चालते?", "How it works")}</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">{num(i + 1)}</span>
                <h3 className="mt-3 font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-brand-700 to-indigo-700 px-6 py-10 text-center text-white shadow-lg md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-bold">{t("आजच सराव सुरू करा", "Start practising today")}</h2>
            <p className="mt-1 text-brand-100">
              {t("लॉगिनसाठी हजेरी क्रमांक व पासवर्ड तुमच्या वर्गशिक्षकांकडून घ्या.", "Get your roll number and password from your class teacher.")}
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-800 shadow-md transition-transform hover:-translate-y-0.5"
          >
            {t("लॉगिन करा", "Login")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <School className="size-4" />
            </span>
            <div>
              <p className="font-semibold text-ink">{school.school_name}</p>
              <p>{school.school_address}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <LangToggle className="sm:hidden" />
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-4" /> {t("नवोदय प्रवेश परीक्षा सराव मंच", "JNVST practice platform")}
            </span>
            <span>© {num(new Date().getFullYear())}</span>
          </div>
        </div>
        <p className="border-t border-slate-100 px-4 py-3 text-center text-[11px] text-slate-400">
          {t(
            "हा शाळेचा सराव मंच आहे; नवोदय विद्यालय समितीची अधिकृत वेबसाइट नाही. अधिकृत माहितीसाठी navodaya.gov.in पाहा.",
            "This is a school practice platform, not the official Navodaya Vidyalaya Samiti website. For official information visit navodaya.gov.in.",
          )}
        </p>
      </footer>
    </div>
  );
}
