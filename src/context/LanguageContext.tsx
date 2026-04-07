import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppLanguage = "en" | "ne";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
};

const translations: Record<AppLanguage, Record<string, string>> = {
  en: {
    nav_home: "Home",
    nav_projects: "Projects",
    nav_ranking: "Ranking",
    nav_admin: "Admin",
    nav_profile: "Profile",
    nav_login: "Login",
    nav_logout: "Logout",
    nav_language_en: "English",
    nav_language_ne: "नेपाली",

    login_welcome: "Welcome back to Najar Nepal",
    login_join: "Join Najar Nepal",
    login_title: "Login",
    login_register: "Create account",
    login_subtitle_login:
      "Sign in to rate leaders, comment on public issues, submit complaints, and manage your public profile.",
    login_subtitle_register:
      "Create your account to rate leaders, submit complaints, and take part in a more transparent civic platform.",
    login_card_login:
      "Login is required for ratings, comments, complaints, and profile features.",
    login_card_register: "Use a strong password to keep your account secure.",
    login_full_name: "Full name",
    login_email: "Email",
    login_password: "Password",
    login_enter_name: "Enter your full name",
    login_enter_email: "Enter your email",
    login_enter_password: "Enter your password",
    login_create_account: "Create Account",
    login_login_btn: "Login",
    login_wait: "Please wait...",
    login_switch_register: "Don’t have an account? Register",
    login_switch_login: "Already have an account? Login",
    login_rate_leaders: "Rate leaders",
    login_submit_complaints: "Submit complaints",
    login_secure_profile: "Secure profile",
    login_rate_desc: "Give public feedback in one place.",
    login_complaint_desc: "Report issues and follow public concerns.",
    login_secure_desc: "Protected access for your activity and profile.",
    login_requirements: "Password requirements",
    login_req1: "At least 8 characters",
    login_req2: "One uppercase letter",
    login_req3: "One lowercase letter",
    login_req4: "One number",
    login_req5: "One special character",
    login_secure_access: "Secure civic access",
    login_name_required: "Full name is required.",
    login_email_required: "Email and password are required.",
    login_email_invalid: "Please enter a valid email address.",
    login_password_weak:
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
    login_register_success: "Registration successful. Please login now.",
    login_success: "Login successful",

    ranking_badge: "Civic ranking",
    ranking_title: "Leaders Ranking",
    ranking_subtitle:
      "A civic leaderboard based on public score, rating quality, discussion activity, and engagement signals.",
    ranking_visible_leaders: "Visible leaders",
    ranking_how_show: "How ranking works",
    ranking_how_hide: "Hide ranking method",
    ranking_last_updated: "Last updated",
    ranking_method_title: "Ranking method",
    ranking_method_text:
      "Public Score combines four signals: rating quality, discussion activity, engagement, and reaction strength. Ratings are confidence-weighted so 1–2 votes do not dominate the leaderboard. Leaders with very little data are shown as emerging profiles instead of pretending high precision.",
    ranking_all_leaders: "All Leaders",
    ranking_top_leaders: "Top leaders",
    ranking_featured_by: "Featured by current ranking",
    ranking_full_board: "Full leaderboard",
    ranking_supporting_metrics: "Public Score with supporting proof metrics",
    ranking_public_score: "Public Score",
    ranking_avg_rating: "Avg rating",
    ranking_ratings: "Ratings",
    ranking_comments: "Comments",
    ranking_engagement: "Engagement",
    ranking_trend: "Trend",
    ranking_go_profile: "Go to Profile",
    ranking_sort_public: "Public Score",
    ranking_sort_highest: "Highest Rated",
    ranking_sort_discussed: "Most Discussed",
    ranking_sort_engaged: "Most Engaged",
    ranking_sort_lowest: "Lowest Rated",
    ranking_top_ranked: "Top Ranked",
    ranking_strong_interest: "Strong Public Interest",
    ranking_high_visibility: "High Visibility",
    ranking_community_ranked: "Community Ranked",
    ranking_emerging: "Emerging profile",
    ranking_developing: "Developing signal",
    ranking_established: "Established signal",
    ranking_trusted: "Trusted by Community",
    ranking_most_discussed_badge: "Most Discussed",
    ranking_verified_profile: "Verified Profile",
    ranking_rising: "Rising This Week",
    ranking_steady: "Steady Attention",
    ranking_building: "Building Interest",
    ranking_limited: "Limited recent data",

    profile_public_profile: "Public profile",
    profile_summary: "Civic summary",
    profile_rate_leader: "Rate Leader",
    profile_follow: "Follow",
    profile_report_mistake: "Report Mistake",
    profile_role_position: "Role / Position",
    profile_district_province: "District and Province",
    profile_party: "Party",
    profile_term_period: "Term period",
    profile_engagement_level: "Engagement level",
    profile_accuracy: "Profile accuracy",
    profile_data_completeness: "data completeness",
    profile_overview: "Overview",
    profile_public_trust_snapshot: "Public trust snapshot",
    profile_citizen_engagement: "Citizen engagement",
    profile_discussion: "Community Discussion",
    profile_discussion_note: "Please keep discussion respectful and constructive.",
    profile_share_thoughts: "Share your thoughts about this leader...",
    profile_share_feedback: "Share civic feedback, not personal abuse.",
    profile_post_comment: "Post Comment",
    profile_posting: "Posting...",
    profile_loading_comments: "Loading comments...",
    profile_first_comment: "Be the first to share your thoughts about this leader.",
    profile_first_comment_sub:
      "Respectful civic discussion helps improve transparency and accountability.",
    profile_like: "Like",
    profile_reply: "Reply",
    profile_replying: "Replying...",
    profile_write_reply: "Write a respectful reply...",
    profile_keep_replies: "Keep replies constructive.",
    profile_report_comment: "Report comment",
    profile_help_keep_safe: "Help keep discussion respectful and safe.",
    profile_submit_report: "Submit Report",
    profile_cancel: "Cancel",
    profile_public_reaction: "Public trust snapshot",
    profile_quick_rate: "Quick rate",
    profile_badges: "Badges and indicators",
    profile_background: "Background",
    profile_activity_updates: "Activity and updates",
    profile_current_interest: "Current interest trend",
    profile_report_factual: "Report a factual mistake",
    profile_help_transparency:
      "Help improve public transparency by reporting incorrect profile information.",
    profile_open_report_form: "Open report form",
    profile_previous_reports: "Your previous profile accuracy reports",
    profile_submit_report_title: "Report a factual mistake",
    profile_submit_report_sub:
      "Help improve profile accuracy using clear, factual corrections.",
    profile_mistake_type: "Mistake type",
    profile_mistake_question: "What is the mistake?",
    profile_suggested_correction: "Suggested correction",
    profile_source_link: "Source / reference link",
    profile_optional_contact: "Optional contact",
    profile_submit_report_btn: "Submit report",
    profile_close: "Close",
    profile_not_added: "Not added yet",

    validate_comment_empty: "Comment cannot be empty.",
    validate_comment_short:
      "Comment is too short. Please write something meaningful.",
    validate_comment_long:
      "Comment is too long. Please keep it under 300 characters.",
    validate_comment_meaningful: "Please write a meaningful comment.",
    validate_comment_spam:
      "Your comment looks spammy. Please rewrite it clearly.",
    validate_comment_offensive:
      "Please avoid offensive language. Keep discussion respectful.",
    validate_reply_empty: "Reply cannot be empty.",
    validate_reply_short: "Reply is too short.",
    validate_reply_long:
      "Reply is too long. Please keep it under 220 characters.",
    validate_reply_spam:
      "Your reply looks spammy. Please rewrite it clearly.",
    validate_reply_offensive:
      "Please avoid offensive language in replies.",
    validate_wait_comment:
      "Please wait a few seconds before posting another comment.",
    validate_report_needed: "Please describe the factual mistake.",
    validate_report_detail:
      "Please provide a little more detail about the mistake.",

    misc_loading_leader: "Loading leader...",
    misc_leader_not_found: "Leader not found",
    misc_profile_not_connected:
      "This profile is not connected yet in the real leader dataset.",
    misc_just_now: "Just now",
  },

  ne: {
    nav_home: "होम",
    nav_projects: "परियोजनाहरू",
    nav_ranking: "र्याङ्किङ",
    nav_admin: "एडमिन",
    nav_profile: "प्रोफाइल",
    nav_login: "लगइन",
    nav_logout: "लगआउट",
    nav_language_en: "English",
    nav_language_ne: "नेपाली",

    login_welcome: "नजर नेपालमा पुनः स्वागत छ",
    login_join: "नजर नेपालमा सहभागी हुनुहोस्",
    login_title: "लगइन",
    login_register: "खाता बनाउनुहोस्",
    login_subtitle_login:
      "नेताहरूलाई मूल्यांकन गर्न, सार्वजनिक विषयमा टिप्पणी गर्न, गुनासो पठाउन र आफ्नो प्रोफाइल व्यवस्थापन गर्न साइन इन गर्नुहोस्।",
    login_subtitle_register:
      "खाता बनाएर नेताहरूलाई मूल्यांकन गर्नुहोस्, गुनासो पठाउनुहोस्, र पारदर्शी नागरिक प्लेटफर्ममा सहभागी हुनुहोस्।",
    login_card_login:
      "रेटिङ, टिप्पणी, गुनासो र प्रोफाइल सुविधाका लागि लगइन आवश्यक छ।",
    login_card_register: "खातालाई सुरक्षित राख्न बलियो पासवर्ड प्रयोग गर्नुहोस्।",
    login_full_name: "पूरा नाम",
    login_email: "इमेल",
    login_password: "पासवर्ड",
    login_enter_name: "आफ्नो पूरा नाम लेख्नुहोस्",
    login_enter_email: "आफ्नो इमेल लेख्नुहोस्",
    login_enter_password: "आफ्नो पासवर्ड लेख्नुहोस्",
    login_create_account: "खाता बनाउनुहोस्",
    login_login_btn: "लगइन",
    login_wait: "कृपया पर्खनुहोस्...",
    login_switch_register: "खाता छैन? दर्ता गर्नुहोस्",
    login_switch_login: "पहिले नै खाता छ? लगइन गर्नुहोस्",
    login_rate_leaders: "नेताहरूलाई मूल्यांकन गर्नुहोस्",
    login_submit_complaints: "गुनासो पठाउनुहोस्",
    login_secure_profile: "सुरक्षित प्रोफाइल",
    login_rate_desc: "एकै ठाउँबाट सार्वजनिक प्रतिक्रिया दिनुहोस्।",
    login_complaint_desc: "समस्या रिपोर्ट गर्नुहोस् र सार्वजनिक गुनासोहरू हेर्नुहोस्।",
    login_secure_desc: "तपाईंको गतिविधि र प्रोफाइल सुरक्षित पहुँचमा राखिन्छ।",
    login_requirements: "पासवर्डका सर्तहरू",
    login_req1: "कम्तीमा ८ अक्षर",
    login_req2: "एक ठूलो अक्षर",
    login_req3: "एक सानो अक्षर",
    login_req4: "एक संख्या",
    login_req5: "एक विशेष चिन्ह",
    login_secure_access: "सुरक्षित नागरिक पहुँच",
    login_name_required: "पूरा नाम आवश्यक छ।",
    login_email_required: "इमेल र पासवर्ड आवश्यक छ।",
    login_email_invalid: "कृपया मान्य इमेल लेख्नुहोस्।",
    login_password_weak:
      "पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ र ठूलो अक्षर, सानो अक्षर, संख्या र विशेष चिन्ह समावेश हुनुपर्छ।",
    login_register_success: "दर्ता सफल भयो। अब लगइन गर्नुहोस्।",
    login_success: "लगइन सफल भयो",

    ranking_badge: "नागरिक र्याङ्किङ",
    ranking_title: "नेतृत्व र्याङ्किङ",
    ranking_subtitle:
      "सार्वजनिक स्कोर, मूल्याङ्कन गुणस्तर, छलफल सक्रियता र संलग्नता संकेतका आधारमा तयार गरिएको नागरिक र्याङ्किङ।",
    ranking_visible_leaders: "देखिएका नेता",
    ranking_how_show: "र्याङ्किङ कसरी काम गर्छ",
    ranking_how_hide: "व्याख्या लुकाउनुहोस्",
    ranking_last_updated: "अन्तिम अद्यावधिक",
    ranking_method_title: "र्याङ्किङ विधि",
    ranking_method_text:
      "सार्वजनिक स्कोर मूल्याङ्कन गुणस्तर, छलफल सक्रियता, संलग्नता र प्रतिक्रिया बलको संयोजन हो। १–२ वटा मात्र रेटिङले सूचीलाई नियन्त्रण नगरोस् भनेर confidence weighting प्रयोग गरिएको छ। निकै थोरै डेटा भएका प्रोफाइललाई उदीयमान प्रोफाइलको रूपमा देखाइन्छ।",
    ranking_all_leaders: "सबै नेता",
    ranking_top_leaders: "शीर्ष नेता",
    ranking_featured_by: "हालको र्याङ्किङका आधारमा विशेष",
    ranking_full_board: "पूरा सूची",
    ranking_supporting_metrics: "सार्वजनिक स्कोर र सहायक प्रमाण मेट्रिक्स",
    ranking_public_score: "सार्वजनिक स्कोर",
    ranking_avg_rating: "औसत रेटिङ",
    ranking_ratings: "रेटिङ",
    ranking_comments: "टिप्पणी",
    ranking_engagement: "संलग्नता",
    ranking_trend: "प्रवृत्ति",
    ranking_go_profile: "प्रोफाइलमा जानुहोस्",
    ranking_sort_public: "सार्वजनिक स्कोर",
    ranking_sort_highest: "उच्चतम रेटिङ",
    ranking_sort_discussed: "सबैभन्दा धेरै छलफल",
    ranking_sort_engaged: "सबैभन्दा धेरै संलग्न",
    ranking_sort_lowest: "न्यूनतम रेटिङ",
    ranking_top_ranked: "शीर्ष स्थान",
    ranking_strong_interest: "उच्च सार्वजनिक चासो",
    ranking_high_visibility: "उच्च दृश्यता",
    ranking_community_ranked: "समुदाय र्याङ्किङ",
    ranking_emerging: "उदीयमान प्रोफाइल",
    ranking_developing: "विकासशील संकेत",
    ranking_established: "स्थापित संकेत",
    ranking_trusted: "समुदायले विश्वास गरेको",
    ranking_most_discussed_badge: "सबैभन्दा धेरै छलफल",
    ranking_verified_profile: "प्रमाणित प्रोफाइल",
    ranking_rising: "यस हप्ता बढ्दो",
    ranking_steady: "स्थिर चासो",
    ranking_building: "बढ्दो रुचि",
    ranking_limited: "हालको डेटा सीमित",

    profile_public_profile: "सार्वजनिक प्रोफाइल",
    profile_summary: "नागरिक सारांश",
    profile_rate_leader: "नेतालाई रेट गर्नुहोस्",
    profile_follow: "फलो गर्नुहोस्",
    profile_report_mistake: "गल्ती रिपोर्ट गर्नुहोस्",
    profile_role_position: "भूमिका / पद",
    profile_district_province: "जिल्ला र प्रदेश",
    profile_party: "पार्टी",
    profile_term_period: "कार्यकाल",
    profile_engagement_level: "संलग्नता स्तर",
    profile_accuracy: "प्रोफाइल शुद्धता",
    profile_data_completeness: "डेटा पूर्णता",
    profile_overview: "सारांश",
    profile_public_trust_snapshot: "सार्वजनिक विश्वास झलक",
    profile_citizen_engagement: "नागरिक संलग्नता",
    profile_discussion: "समुदाय छलफल",
    profile_discussion_note: "कृपया छलफललाई सम्मानजनक र रचनात्मक राख्नुहोस्।",
    profile_share_thoughts: "यस नेताबारे आफ्नो विचार साझा गर्नुहोस्...",
    profile_share_feedback: "नागरिक प्रतिक्रिया दिनुहोस्, व्यक्तिगत दुव्र्यवहार होइन।",
    profile_post_comment: "टिप्पणी पोस्ट गर्नुहोस्",
    profile_posting: "पोस्ट हुँदैछ...",
    profile_loading_comments: "टिप्पणीहरू लोड हुँदैछन्...",
    profile_first_comment: "यस नेताबारे आफ्नो विचार साझा गर्ने पहिलो व्यक्ति बन्नुहोस्।",
    profile_first_comment_sub:
      "सम्मानजनक नागरिक छलफलले पारदर्शिता र जवाफदेहिता सुधार गर्छ।",
    profile_like: "मनपर्‍यो",
    profile_reply: "उत्तर दिनुहोस्",
    profile_replying: "उत्तर पठाउँदै...",
    profile_write_reply: "सम्मानजनक उत्तर लेख्नुहोस्...",
    profile_keep_replies: "उत्तरहरू रचनात्मक राख्नुहोस्।",
    profile_report_comment: "टिप्पणी रिपोर्ट गर्नुहोस्",
    profile_help_keep_safe: "छलफललाई सुरक्षित र सम्मानजनक राख्न सहयोग गर्नुहोस्।",
    profile_submit_report: "रिपोर्ट पठाउनुहोस्",
    profile_cancel: "रद्द गर्नुहोस्",
    profile_public_reaction: "सार्वजनिक विश्वास झलक",
    profile_quick_rate: "छिटो रेटिङ",
    profile_badges: "ब्याज र सूचकहरू",
    profile_background: "पृष्ठभूमि",
    profile_activity_updates: "गतिविधि र अपडेटहरू",
    profile_current_interest: "हालको चासो प्रवृत्ति",
    profile_report_factual: "तथ्यगत गल्ती रिपोर्ट गर्नुहोस्",
    profile_help_transparency:
      "गलत प्रोफाइल जानकारी रिपोर्ट गरेर सार्वजनिक पारदर्शिता सुधार गर्न सहयोग गर्नुहोस्।",
    profile_open_report_form: "रिपोर्ट फारम खोल्नुहोस्",
    profile_previous_reports: "तपाईंका अघिल्ला प्रोफाइल शुद्धता रिपोर्टहरू",
    profile_submit_report_title: "तथ्यगत गल्ती रिपोर्ट गर्नुहोस्",
    profile_submit_report_sub:
      "स्पष्ट र तथ्यगत सुधारमार्फत प्रोफाइल शुद्धता सुधार गर्न सहयोग गर्नुहोस्।",
    profile_mistake_type: "गल्तीको प्रकार",
    profile_mistake_question: "गल्ती के हो?",
    profile_suggested_correction: "सुझाव गरिएको सुधार",
    profile_source_link: "स्रोत / सन्दर्भ लिंक",
    profile_optional_contact: "वैकल्पिक सम्पर्क",
    profile_submit_report_btn: "रिपोर्ट पठाउनुहोस्",
    profile_close: "बन्द गर्नुहोस्",
    profile_not_added: "अहिलेसम्म थपिएको छैन",

    validate_comment_empty: "टिप्पणी खाली हुन सक्दैन।",
    validate_comment_short:
      "टिप्पणी धेरै छोटो छ। कृपया अर्थपूर्ण लेख्नुहोस्।",
    validate_comment_long:
      "टिप्पणी धेरै लामो छ। कृपया ३०० अक्षरभित्र राख्नुहोस्।",
    validate_comment_meaningful: "कृपया अर्थपूर्ण टिप्पणी लेख्नुहोस्।",
    validate_comment_spam:
      "तपाईंको टिप्पणी स्पाम जस्तो देखिन्छ। कृपया स्पष्ट रूपमा फेरि लेख्नुहोस्।",
    validate_comment_offensive:
      "कृपया अपमानजनक भाषा प्रयोग नगर्नुहोस्।",
    validate_reply_empty: "उत्तर खाली हुन सक्दैन।",
    validate_reply_short: "उत्तर धेरै छोटो छ।",
    validate_reply_long:
      "उत्तर धेरै लामो छ। कृपया २२० अक्षरभित्र राख्नुहोस्।",
    validate_reply_spam:
      "तपाईंको उत्तर स्पाम जस्तो देखिन्छ। कृपया स्पष्ट रूपमा फेरि लेख्नुहोस्।",
    validate_reply_offensive:
      "कृपया उत्तरमा अपमानजनक भाषा प्रयोग नगर्नुहोस्।",
    validate_wait_comment:
      "अर्को टिप्पणी पोस्ट गर्नु अघि केही सेकेन्ड पर्खनुहोस्।",
    validate_report_needed: "कृपया तथ्यगत गल्ती वर्णन गर्नुहोस्।",
    validate_report_detail:
      "कृपया गल्तीबारे अलि विस्तृत विवरण दिनुहोस्।",

    misc_loading_leader: "नेता लोड हुँदैछ...",
    misc_leader_not_found: "नेता भेटिएन",
    misc_profile_not_connected:
      "यो प्रोफाइल अझै वास्तविक नेता डेटासेटसँग जडान गरिएको छैन।",
    misc_just_now: "भर्खरै",
  },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem("app-language");
    return saved === "ne" ? "ne" : "en";
  });

  useEffect(() => {
    localStorage.setItem("app-language", language);
    document.documentElement.lang = language === "ne" ? "ne" : "en";
  }, [language]);

  const setLanguage = (lang: AppLanguage) => setLanguageState(lang);
  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === "en" ? "ne" : "en"));
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: (key: string) => translations[language][key] || key,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}