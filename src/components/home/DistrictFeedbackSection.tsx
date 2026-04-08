import { useEffect, useMemo, useRef, useState } from "react";
import type { DistrictInfo } from "../../types/home";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

type Props = {
  district: DistrictInfo | null;
  onScoreSaved: (districtName: string, score: number) => void;
};

type FeedbackForm = {
  transportation: number;
  roads: number;
  safety: number;
  cleanliness: number;
  publicServices: number;
  scenery: number;
};

type DistrictScoreState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "empty"; contributors: number }
  | { status: "ready"; score: number; contributors: number }
  | { status: "error"; message: string };

type DistrictFeedbackSummaryResponse = {
  districtId: string;
  status: "empty" | "ready";
  score: number | null;
  verifiedContributors: number;
};

type MyDistrictFeedbackResponse = {
  districtId: string;
  hasFeedback: boolean;
  feedback: Partial<FeedbackForm> | null;
};

type MyFeedbackState =
  | { status: "idle"; hasSavedFeedback: false }
  | { status: "loading"; hasSavedFeedback: false }
  | { status: "ready"; hasSavedFeedback: boolean }
  | { status: "error"; hasSavedFeedback: false; message: string };

const defaultFeedback: FeedbackForm = {
  transportation: 50,
  roads: 50,
  safety: 50,
  cleanliness: 50,
  publicServices: 50,
  scenery: 50,
};

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getScoreTone(value: number) {
  if (value >= 75) {
    return {
      chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
      bar: "bg-[linear-gradient(90deg,#2563eb_0%,#0f766e_100%)]",
      track: "bg-emerald-100",
      text: "text-emerald-700",
    };
  }

  if (value >= 50) {
    return {
      chip: "bg-amber-50 text-amber-700 border-amber-200",
      bar: "bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_100%)]",
      track: "bg-amber-100",
      text: "text-amber-700",
    };
  }

  return {
    chip: "bg-red-50 text-red-700 border-red-200",
    bar: "bg-[linear-gradient(90deg,#ef4444_0%,#dc2626_100%)]",
    track: "bg-red-100",
    text: "text-red-700",
  };
}

function ScoreField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const tone = getScoreTone(value);

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-1 text-xs text-slate-500">0 low - 100 strong</p>
        </div>

        <span className={`rounded-full border px-3 py-1.5 text-sm font-bold ${tone.chip}`}>
          {value}
        </span>
      </div>

      <div className={`mb-3 h-2.5 overflow-hidden rounded-full ${tone.track}`}>
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${value}%` }} />
      </div>

      <div className="mb-3 grid grid-cols-5 gap-1">
        {Array.from({ length: 5 }).map((_, index) => {
          const active = value >= (index + 1) * 20;
          return (
            <span
              key={`${label}-${index}`}
              className={`h-2 rounded-full transition ${
                active ? tone.bar : "bg-slate-200"
              }`}
            />
          );
        })}
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}

function OverallScoreCard({
  title,
  state,
}: {
  title: string;
  state: DistrictScoreState;
}) {
  if (state.status === "idle") {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm lg:min-w-[220px]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Select a district to view public feedback.
        </p>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="rounded-[24px] border border-blue-100 bg-white px-5 py-4 shadow-sm lg:min-w-[220px]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <div className="skeleton-shimmer mt-3 h-9 w-20 rounded-xl" />
        <p className="mt-3 text-sm leading-6 text-slate-500">Loading district score...</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-[24px] border border-red-100 bg-white px-5 py-4 shadow-sm lg:min-w-[220px]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-400">N/A</p>
        <p className="mt-2 text-xs leading-5 text-red-600">Unable to load score</p>
      </div>
    );
  }

  if (state.status === "empty") {
    return (
      <div className="rounded-[24px] border border-blue-100 bg-white px-5 py-4 shadow-sm lg:min-w-[220px]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight text-blue-700">0</p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-blue-100">
          <div className="h-full w-[10%] rounded-full bg-[linear-gradient(90deg,#94a3b8_0%,#cbd5e1_100%)]" />
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">No verified feedback yet</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Verified contributors: {state.contributors}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-blue-100 bg-white px-5 py-4 shadow-sm lg:min-w-[220px]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-4xl font-extrabold tracking-tight text-blue-700">
        {state.score}
      </p>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-blue-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#0f766e_100%)]"
          style={{ width: `${Math.max(8, Math.min(state.score, 100))}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Verified contributors: {state.contributors}
      </p>
    </div>
  );
}

function DistrictFeedbackSection({ district, onScoreSaved }: Props) {
  const { language } = useLanguage();
  const { token, user, isAuthenticated } = useAuth();

  const text =
    language === "ne"
      ? {
          emptyTitle: "जिल्ला सार्वजनिक प्रतिक्रिया",
          emptyText:
            "जिल्ला चयन गरेपछि यहाँ यातायात, सडक, सुरक्षा, सरसफाइ र सार्वजनिक सेवाबारे विस्तृत प्रतिक्रिया दिन सकिन्छ।",
          districtFeedback: "जिल्ला सार्वजनिक प्रतिक्रिया",
          helperText: "आफ्नो स्थानीय अनुभवका आधारमा यो जिल्लालाई मूल्यांकन गर्नुहोस्।",
          verifiedOnly: "प्रमाणित प्रयोगकर्ताका लागि मात्र",
          updateLater: "तपाईंले पछि आफ्नै प्रतिक्रिया फेरि अपडेट गर्न सक्नुहुन्छ।",
          loginRequired: "जिल्ला प्रतिक्रिया दिन लगइन आवश्यक छ।",
          aggregateScore: "समग्र सार्वजनिक स्कोर",
          aggregateHelper: "तपाईंको वर्गगत मूल्याङ्कनबाट गणना गरिएको",
          contributors: "प्रमाणित योगदानकर्ता",
          transportation: "यातायात",
          roads: "सडक अवस्था",
          safety: "सुरक्षा",
          cleanliness: "सरसफाइ",
          publicServices: "सार्वजनिक सेवा",
          scenery: "दृश्य / भ्रमण अनुभव",
          saveFeedback: "प्रतिक्रिया सुरक्षित गर्नुहोस्",
          saving: "सुरक्षित हुँदैछ...",
          reset: "रिसेट",
          feedbackSaved: "जिल्ला प्रतिक्रिया सफलतापूर्वक सुरक्षित भयो।",
          noSummary: "अझै कुनै प्रमाणित सार्वजनिक प्रतिक्रिया छैन।",
          alreadySubmitted: "तपाईंले यस जिल्लाका लागि प्रतिक्रिया दिएको छ।",
          firstSubmit: "तपाईंले यस जिल्लाका लागि पहिलो पटक प्रतिक्रिया दिनुहुन्छ।",
        }
      : {
          emptyTitle: "District Public Feedback",
          emptyText:
            "Once a district is selected, you can submit detailed feedback here for transportation, roads, safety, cleanliness, and public services.",
          districtFeedback: "District Public Feedback",
          helperText: "Rate this district based on your local experience.",
          verifiedOnly: "Verified users only",
          updateLater: "You can update your feedback later.",
          loginRequired: "Login is required to submit district feedback.",
          aggregateScore: "Overall Public Score",
          aggregateHelper: "Calculated from your category ratings",
          contributors: "Verified contributors",
          transportation: "Transportation",
          roads: "Road Condition",
          safety: "Safety",
          cleanliness: "Cleanliness",
          publicServices: "Public Services",
          scenery: "Scenic / Visitor Experience",
          saveFeedback: "Save Feedback",
          saving: "Saving...",
          reset: "Reset",
          feedbackSaved: "District feedback saved successfully.",
          noSummary: "No verified public feedback yet.",
          alreadySubmitted: "You already submitted feedback for this district.",
          firstSubmit: "You are submitting feedback for this district for the first time.",
        };

  const [form, setForm] = useState<FeedbackForm>(defaultFeedback);
  const [initialForm, setInitialForm] = useState<FeedbackForm>(defaultFeedback);
  const [scoreState, setScoreState] = useState<DistrictScoreState>({ status: "idle" });
  const [myFeedbackState, setMyFeedbackState] = useState<MyFeedbackState>({
    status: "idle",
    hasSavedFeedback: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const summaryRequestIdRef = useRef(0);
  const myFeedbackRequestIdRef = useRef(0);

  const isVerifiedUser =
    user?.verificationStatus === "verified" || (user as any)?.isVerified === true;
  const districtId = district?.districtId || "";
  const districtName = district?.name || "";

  const applyFeedbackForm = (feedback: Partial<FeedbackForm> | null) => {
    if (!feedback) {
      setForm(defaultFeedback);
      setInitialForm(defaultFeedback);
      return;
    }

    const next: FeedbackForm = {
      transportation: feedback.transportation ?? 50,
      roads: feedback.roads ?? 50,
      safety: feedback.safety ?? 50,
      cleanliness: feedback.cleanliness ?? 50,
      publicServices: feedback.publicServices ?? 50,
      scenery: feedback.scenery ?? 50,
    };

    setForm(next);
    setInitialForm(next);
  };

  useEffect(() => {
    if (!districtId) {
      setForm(defaultFeedback);
      setInitialForm(defaultFeedback);
      setScoreState({ status: "idle" });
      setMyFeedbackState({ status: "idle", hasSavedFeedback: false });
      setMessage("");
      return;
    }

    const requestId = ++summaryRequestIdRef.current;

    const loadSummary = async () => {
      try {
        setScoreState({ status: "loading" });
        const data = (await api.getDistrictFeedbackSummary(
          districtId
        )) as DistrictFeedbackSummaryResponse | null;

        if (summaryRequestIdRef.current !== requestId || data?.districtId !== districtId) {
          return;
        }

        if (data?.status === "ready" && typeof data.score === "number") {
          setScoreState({
            status: "ready",
            score: data.score,
            contributors: data.verifiedContributors || 0,
          });
          onScoreSaved(districtName, data.score);
        } else {
          setScoreState({
            status: "empty",
            contributors: data?.verifiedContributors || 0,
          });
        }
      } catch (error) {
        if (summaryRequestIdRef.current !== requestId) {
          return;
        }

        console.error("Failed to load district feedback summary:", error);
        setScoreState({
          status: "error",
          message: getErrorMessage(error, "Failed to load district score"),
        });
      }
    };

    void loadSummary();
  }, [districtId, districtName, onScoreSaved]);

  useEffect(() => {
    if (!districtId || !token || !isAuthenticated) {
      applyFeedbackForm(null);
      setMyFeedbackState({ status: "idle", hasSavedFeedback: false });
      return;
    }

    const requestId = ++myFeedbackRequestIdRef.current;

    const loadMyFeedback = async () => {
      try {
        setMyFeedbackState({ status: "loading", hasSavedFeedback: false });
        const data = (await api.getMyDistrictFeedback(
          token,
          districtId
        )) as MyDistrictFeedbackResponse | null;

        if (myFeedbackRequestIdRef.current !== requestId || data?.districtId !== districtId) {
          return;
        }

        applyFeedbackForm(data?.feedback || null);
        setMyFeedbackState({
          status: "ready",
          hasSavedFeedback: Boolean(data?.hasFeedback),
        });
      } catch (error) {
        if (myFeedbackRequestIdRef.current !== requestId) {
          return;
        }

        console.error("Failed to load my district feedback:", error);
        applyFeedbackForm(null);
        setMyFeedbackState({
          status: "error",
          hasSavedFeedback: false,
          message: getErrorMessage(error, "Failed to load your feedback"),
        });
      }
    };

    void loadMyFeedback();
  }, [districtId, token, isAuthenticated]);

  const overallValue = useMemo(() => {
    return average([
      form.transportation,
      form.roads,
      form.safety,
      form.cleanliness,
      form.publicServices,
      form.scenery,
    ]);
  }, [form]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  const hasPreviousSubmission = myFeedbackState.hasSavedFeedback;

  const handleSave = async () => {
    if (!districtId || !districtName) return;

    if (!isAuthenticated || !token) {
      setMessage(text.loginRequired);
      return;
    }

    if (!isVerifiedUser) {
      setMessage(text.verifiedOnly);
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const result = await api.submitDistrictFeedback(token, districtId, form);

      if (result?.summary?.score !== undefined && result.summary?.score !== null) {
        onScoreSaved(districtName, result.summary.score);
      }

      const nextSummary = result?.summary || null;
      const nextScore =
        typeof nextSummary?.score === "number"
          ? nextSummary.score
          : null;
      const nextContributors =
        typeof nextSummary?.verifiedContributors === "number"
          ? nextSummary.verifiedContributors
          : 0;

      setScoreState(
        nextScore !== null
          ? {
              status: "ready",
              score: nextScore,
              contributors: nextContributors,
            }
          : {
              status: "empty",
              contributors: nextContributors,
            }
      );
      setMyFeedbackState({ status: "ready", hasSavedFeedback: true });
      setInitialForm(form);
      setMessage(result?.message || text.feedbackSaved);
    } catch (error: unknown) {
      setMessage(getErrorMessage(error, "Failed to save district feedback"));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setMessage("");
  };

  if (!district) {
    return (
      <section className="relative z-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm [contain:layout_paint] md:p-6">
        <div className="rounded-[24px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6 shadow-sm">
          <h3 className="text-xl font-bold tracking-tight text-slate-950">
            {text.emptyTitle}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {text.emptyText}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm [contain:layout_paint] md:p-6">
      <div className="rounded-[28px] border border-blue-100 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold tracking-tight text-slate-950">
              {text.districtFeedback}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{text.helperText}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                {text.verifiedOnly}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                {text.updateLater}
              </span>
            </div>
          </div>

          <OverallScoreCard title={text.aggregateScore} state={scoreState} />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {isAuthenticated
            ? isVerifiedUser
              ? hasPreviousSubmission
                ? text.alreadySubmitted
                : text.firstSubmit
              : text.verifiedOnly
            : text.loginRequired}
        </div>

        {myFeedbackState.status === "error" ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {myFeedbackState.message}
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            {message}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ScoreField
            label={text.transportation}
            value={form.transportation}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, transportation: value }))
            }
          />
          <ScoreField
            label={text.roads}
            value={form.roads}
            onChange={(value) => setForm((prev) => ({ ...prev, roads: value }))}
          />
          <ScoreField
            label={text.safety}
            value={form.safety}
            onChange={(value) => setForm((prev) => ({ ...prev, safety: value }))}
          />
          <ScoreField
            label={text.cleanliness}
            value={form.cleanliness}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, cleanliness: value }))
            }
          />
          <ScoreField
            label={text.publicServices}
            value={form.publicServices}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, publicServices: value }))
            }
          />
          <ScoreField
            label={text.scenery}
            value={form.scenery}
            onChange={(value) => setForm((prev) => ({ ...prev, scenery: value }))}
          />
        </div>

        <div className="mt-6 rounded-[24px] border border-slate-900 bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] px-6 py-5 text-white shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                {text.aggregateScore}
              </p>
              <p className="mt-2 text-sm text-slate-300">{text.aggregateHelper}</p>
            </div>

            <div className="text-right">
              <p className="text-5xl font-extrabold tracking-tight">{overallValue}</p>
            </div>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${getScoreTone(overallValue).bar}`}
              style={{ width: `${Math.max(8, Math.min(overallValue, 100))}%` }}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {text.reset}
          </button>

          <button
            onClick={handleSave}
            disabled={
              !isAuthenticated ||
              !isVerifiedUser ||
              saving ||
              myFeedbackState.status === "loading" ||
              !hasChanges
            }
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? text.saving : text.saveFeedback}
          </button>
        </div>

        {scoreState.status === "empty" ? (
          <p className="mt-3 text-xs text-slate-500">{text.noSummary}</p>
        ) : null}
      </div>
    </section>
  );
}

export default DistrictFeedbackSection;
