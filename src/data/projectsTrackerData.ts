export type ProjectStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BROKEN"
  | "STALLED";

export type ProjectSource = {
  sourceName?: string;
  title?: string;
  url?: string;
  publishedAt?: string | null;
  summary?: string;
  note?: string;
};

export type ProjectItem = {
  id: string;
  category: string;
  titleNp: string;
  titleEn: string;
  status: ProjectStatus;
  daysText: string;
  source?: string;
  updatedAt: string;
  priority?: "low" | "medium" | "high";
  progressSummary?: string;
  evidenceText?: string;
  whatIsThis?: string;
  impactOnPeople?: string;
  whyNeeded?: string;
  dueDate?: string;
  sources?: ProjectSource[];
};

export const trackerSummary = {
  total: 100,
  completed: 0,
  inProgress: 19,
  broken: 0,
  stalled: 0,
  notStarted: 81,
  overallProgress: 4,
};

export const categoryProgress = [
  { name: "National Unity & Governance", done: 0, total: 8, percent: 0 },
  { name: "Public Administration Reform", done: 0, total: 15, percent: 0 },
  { name: "Citizen Services", done: 0, total: 4, percent: 0 },
  { name: "Digital Governance", done: 0, total: 15, percent: 0 },
  { name: "Anti-Corruption & Good Governance", done: 0, total: 8, percent: 0 },
  { name: "Economy & Investment", done: 0, total: 14, percent: 0 },
  { name: "Infrastructure & Energy", done: 0, total: 11, percent: 0 },
  { name: "Education & Health", done: 0, total: 7, percent: 0 },
  { name: "Agriculture & Environment", done: 0, total: 5, percent: 0 },
  { name: "Land Reform & Public Assets", done: 0, total: 5, percent: 0 },
  { name: "Security & Strategic Affairs", done: 0, total: 8, percent: 0 },
];

export const projectItems: ProjectItem[] = [
  {
    id: "#001",
    category: "National Unity & Governance",
    titleNp: "राष्ट्रिय सहमतिका विषयमा प्रमुख दलहरूसँग छलफल प्रारम्भ गर्ने",
    titleEn: "Initiate dialogue with major parties on national consensus issues",
    status: "IN_PROGRESS",
    daysText: "11 days left",
    source: "risingnepaldaily.com, nepalkhabar.com, kathmandupost.com",
    updatedAt: "2026-03-31",
    priority: "high",
    dueDate: "30 days — 2026-04-11",
    progressSummary:
      "Initial public and political discussion indicates movement around national consensus building.",
    evidenceText:
      "Independent monitoring suggests the issue has entered active political discussion, but full delivery is not yet complete.",
    whatIsThis:
      "A political process to build consensus among major parties on national governance issues.",
    impactOnPeople:
      "If successful, this can reduce political deadlock and improve policy continuity.",
    whyNeeded:
      "Major state decisions often stall without broad political agreement.",
    sources: [
      {
        sourceName: "risingnepaldaily.com",
        title: "Consensus-related political discussion reported",
        summary: "Coverage indicates early movement on dialogue among major forces.",
      },
      {
        sourceName: "nepalkhabar.com",
        title: "National discussion around consensus agenda",
        summary: "Reports suggest the issue is under active consideration.",
      },
      {
        sourceName: "kathmandupost.com",
        title: "Political coordination and consensus signals",
        summary: "Media reporting connects current decisions to consensus-building efforts.",
      },
    ],
  },

  {
    id: "#002",
    category: "National Unity & Governance",
    titleNp: "संविधान कार्यान्वयनको समग्र समीक्षा गरी प्रतिवेदन तयार गर्ने",
    titleEn: "Conduct comprehensive review of constitution implementation and prepare report",
    status: "IN_PROGRESS",
    daysText: "26 days left",
    source: "kathmandupost.com",
    updatedAt: "2026-03-30",
    priority: "high",
    dueDate: "30 days — 2026-04-27",
    progressSummary:
      "Constitutional amendment discussion paper committee formation (March 30) will inherently involve reviewing constitution implementation gaps. Parliament session recommendation creates the institutional framework for this review.",
    evidenceText:
      "संविधान संशोधनको बहस पत्र तयार पार्ने समिति गठन भएकोले संविधान कार्यान्वयन समीक्षा पनि यसैसँग अघि बढ्ने सम्भावना। संसद अधिवेशन सिफारिस।",
    whatIsThis:
      "A comprehensive audit of how Nepal's 2015 constitution has been implemented — identifying which provisions have been enacted, which are stalled, and what gaps remain between the constitutional promise and ground reality.",
    impactOnPeople:
      "Citizens will finally see a transparent scorecard of constitutional implementation. Provinces and local governments can demand resources and powers guaranteed to them but never delivered.",
    whyNeeded:
      "Many constitutional provisions — from fundamental rights to fiscal federalism — exist only on paper. Without systematic review, accountability gaps persist and citizens cannot claim their rights.",
    sources: [
      {
        sourceName: "kathmandupost.com",
        title: "Parliament session recommendation and committee formation",
        summary:
          "Follow-up on committee formation suggests the review process is moving.",
        note: "Used as evidence for in-progress constitutional review activity.",
      },
    ],
  },

  {
    id: "#003",
    category: "National Unity & Governance",
    titleNp: "संक्रमणकालीन न्यायसम्बन्धी बाँकी काम टुंग्याउने",
    titleEn: "Complete remaining transitional justice work",
    status: "NOT_STARTED",
    daysText: "96 days left",
    updatedAt: "2026-03-28",
    priority: "medium",
    dueDate: "100 days — 2026-07-04",
  },
];