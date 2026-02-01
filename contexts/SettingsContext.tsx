import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

export const translations = {
  en: {
    // General
    settings: "Settings",
    appearance: "Appearance",
    darkMode: "Dark Mode",
    darkModeDesc: "Adjust the interface contrast",
    language: "Language",
    english: "English",
    arabic: "Arabic",
    system: "System",
    resetData: "Reset Application Data",
    logOut: "Log Out",
    back: "Back",
    next: "Next",
    nextStep: "Next Step",
    complete: "Complete Setup",
    loading: "Loading",
    profile: "Profile",
    
    // Notifications
    notifications: "Notifications",
    notifEnable: "Enable Reminders",
    notifTime: "Daily Reminder Time",
    notifPermission: "Permission Status",
    notifGranted: "Granted",
    notifDenied: "Denied",
    notifRequest: "Enable Notifications",
    notifDesc: "Get notified for workouts and progress",

    // Hydration
    hydration: "Hydration",
    hydrationEnable: "Hydration Reminders",
    hydrationInterval: "Frequency",
    hydrationIntervalDesc: "Interval between water reminders",
    hydrationInterval1: "Every hour",
    hydrationInterval2: "Every 2 hours",
    hydrationInterval3: "Every 3 hours",
    hydrationInterval4: "Every 4 hours",
    
    // Auth
    authTitle: "ASCEND",
    authVerify: "Identity verification required.",
    authInit: "Initialize new athlete protocol.",
    authName: "Full Name",
    authEmail: "Email Address",
    authPass: "Password",
    authForgot: "Forgot Password?",
    authEstablish: "Establish Connection",
    authRegister: "Register Identity",
    authNewUser: "New user?",
    authExisting: "Existing user?",
    authInitProto: "Initialize Protocol",
    authSignIn: "Sign in",
    authOr: "Or continue with",
    
    // Onboarding
    obAbout: "About You",
    obCalibrate: "Calibrating physiological baseline.",
    obNamePlaceholder: "Enter your name",
    obGender: "Gender",
    obMale: "Male",
    obFemale: "Female",
    obAge: "Age",
    obHeight: "Height",
    obWeight: "Weight",
    obGoals: "Goals",
    obGoalPrompt: "What is your primary goal?",
    obGoalFatLoss: "Fat Loss",
    obGoalFatLossDesc: "Shed body fat while maintaining muscle.",
    obGoalMuscle: "Muscle Gain",
    obGoalMuscleDesc: "Build size and strength.",
    obGoalRecomp: "Recomposition",
    obGoalRecompDesc: "Lose fat and build muscle simultaneously.",
    obGoalAthletic: "Athletic Performance",
    obGoalAthleticDesc: "Improve speed, agility and power.",
    obExp: "Experience",
    obExpLevel: "Current Fitness Level",
    obExpBeg: "Beginner",
    obExpBegDesc: "New to training or returning after a long break.",
    obExpInt: "Intermediate",
    obExpIntDesc: "Consistent training for 6+ months.",
    obExpAdv: "Advanced",
    obExpAdvDesc: "Consistent training for 2+ years.",
    
    // Equipment / Constraints
    eqTitle: "Finalize Your Plan",
    eqSubtitle: "Customize the protocol to fit your life.",
    eqAccess: "Equipment Access",
    eqGym: "Commercial Gym",
    eqGymDesc: "Full access to machines & free weights.",
    eqHome: "Home Gym",
    eqHomeDesc: "Rack, bench, and barbell setup.",
    eqDumbbells: "Dumbbells Only",
    eqDumbbellsDesc: "Limited equipment availability.",
    eqBodyweight: "Bodyweight",
    eqBodyweightDesc: "No equipment needed.",
    eqDays: "Training Days",
    eqLimitations: "Physical Limitations",
    eqNone: "None",
    eqShoulder: "Shoulder",
    eqKnee: "Knee",
    eqBack: "Lower Back",
    eqWrist: "Wrist",
    eqBio: "Biometric Data (Optional)",
    eqInbody: "InBody Scan",
    eqInbodyDesc: "Upload your report for precision.",
    eqUpload: "Upload",
    eqSynced: "Synced",
    eqGenerate: "Generate Plan",

    // Dashboard
    welcome: "Welcome",
    overview: "Overview",
    nutrition: "Nutrition",
    analytics: "Analytics",
    week: "Week",
    sending: "Sending...",
    reportSent: "Report Sent",
    weeklyStatus: "Weekly Status",
    reportInjury: "Report Injury",
    coachBrief: "Coach's Brief",
    phase: "PHASE: ACCUMULATION",
    rest: "Rest",
    exercises: "Exercises",
    sets: "SETS",
    reps: "REPS",
    dailyCalories: "Daily Calories",
    proteinTarget: "Protein Target",
    recommendedFuel: "Recommended Fuel",
    projectedWeight: "Projected Weight",
    milestones: "Milestones",
    timeline: "Timeline",
    focus: "FOCUS",
    weekFocus: "HYPERTROPHY",
    finishWeek: "Complete Week",
    finishProgram: "Complete Program",
    finishWeekRequirements: "Complete all exercises & meals to proceed",

    // Meal Scanner
    scanMeal: "Scan Meal",
    scanDesc: "Analyze caloric density and macro profile.",
    analyzing: "Analyzing Composition...",
    verdictApproved: "APPROVED",
    verdictCaution: "CAUTION",
    verdictRejected: "REJECTED",
    replaceWith: "Replace With",
    harmWarning: "Harmful Impact Detected",

    // Profile & Credits
    creditBalance: "Credit Balance",
    getCredits: "Get Credits",
    premiumUpgrade: "Upgrade to Premium",
    premiumDesc: "Unlock unlimited potential with our elite tier.",
    manageSub: "Manage Subscription",
    startPremium: "Start Premium Plan",
    purchase: "Purchase",
    currentPlan: "Current Plan",
    freeTier: "Standard Tier",
    premiumTier: "Elite Tier",
    memberSince: "Member Since",
    biometrics: "Biometrics",
    bmi: "BMI",
    
    // Visualizer Muscles
    muscles: {
        traps: "Trapezius",
        shoulders: "Deltoids",
        chest: "Pectoralis",
        abs: "Abdominals",
        lats: "Latissimus Dorsi",
        obliques: "Obliques",
        arms: "Arms",
        forearms: "Forearms",
        legs: "Quadriceps",
        calves: "Calves",
        glutes: "Glutes",
        waist: "Lower Back / Waist"
    },
    muscleFunctions: {
        traps: "Scapular Elevation",
        shoulders: "Abduction/Flexion",
        chest: "Adduction",
        abs: "Core Stability",
        lats: "Pull/Adduction",
        obliques: "Rotation",
        arms: "Flexion/Extension",
        forearms: "Grip Strength",
        legs: "Knee Extension",
        calves: "Plantar Flexion",
        glutes: "Hip Extension",
        waist: "Spinal Stability"
    },
    
    // Calibration
    calibTitle: "Calibration",
    calibDescCurrent: "Define your current physiological baseline.",
    calibDescTarget: "Set your ideal target goals. Overlay active.",
    calibCurrent: "Current",
    calibTarget: "Target",
    calibComp: "Composition",
    calibMuscle: "Muscle Development",
    calibBodyFat: "Body Fat %",
    calibGenProto: "Generate Protocol"
  },
  ar: {
    // General
    settings: "الإعدادات",
    appearance: "المظهر",
    darkMode: "الوضع الداكن",
    darkModeDesc: "تعديل تباين الواجهة",
    language: "اللغة",
    english: "الإنجليزية",
    arabic: "العربية",
    system: "النظام",
    resetData: "إعادة تعيين البيانات",
    logOut: "تسجيل الخروج",
    back: "رجوع",
    next: "التالي",
    nextStep: "الخطوة التالية",
    complete: "إتمام الإعداد",
    loading: "جاري التحميل",
    profile: "الملف الشخصي",

    // Notifications
    notifications: "التنبيهات",
    notifEnable: "تفعيل التذكيرات",
    notifTime: "وقت التذكير اليومي",
    notifPermission: "حالة الإذن",
    notifGranted: "مسموح",
    notifDenied: "مرفوض",
    notifRequest: "تفعيل التنبيهات",
    notifDesc: "احصل على تنبيهات للتمارين والتقدم",

    // Hydration
    hydration: "الترطيب",
    hydrationEnable: "تذكيرات شرب الماء",
    hydrationInterval: "فترة التذكير",
    hydrationIntervalDesc: "كم مرة تريد تذكيرك بشرب الماء",
    hydrationInterval1: "كل ساعة",
    hydrationInterval2: "كل ساعتين",
    hydrationInterval3: "كل 3 ساعات",
    hydrationInterval4: "كل 4 ساعات",

    // Auth
    authTitle: "ASCEND",
    authVerify: "مطلوب التحقق من الهوية.",
    authInit: "تهيئة بروتوكول رياضي جديد.",
    authName: "الاسم الكامل",
    authEmail: "البريد الإلكتروني",
    authPass: "كلمة المرور",
    authForgot: "نسيت كلمة المرور؟",
    authEstablish: "إنشاء اتصال",
    authRegister: "تسجيل الهوية",
    authNewUser: "مستخدم جديد؟",
    authExisting: "مستخدم حالي؟",
    authInitProto: "بدء البروتوكول",
    authSignIn: "تسجيل الدخول",
    authOr: "أو الاستمرار بواسطة",

    // Onboarding
    obAbout: "معلومات عنك",
    obCalibrate: "معايرة الخط الأساسي الفسيولوجي.",
    obNamePlaceholder: "أدخل اسمك",
    obGender: "الجنس",
    obMale: "ذكر",
    obFemale: "أنثى",
    obAge: "العمر",
    obHeight: "الطول",
    obWeight: "الوزن",
    obGoals: "الأهداف",
    obGoalPrompt: "ما هو هدفك الأساسي؟",
    obGoalFatLoss: "خسارة الدهون",
    obGoalFatLossDesc: "حرق الدهون مع الحفاظ على العضلات.",
    obGoalMuscle: "بناء العضلات",
    obGoalMuscleDesc: "زيادة الحجم والقوة.",
    obGoalRecomp: "إعادة تشكيل الجسم",
    obGoalRecompDesc: "خسارة الدهون وبناء العضلات معاً.",
    obGoalAthletic: "الأداء الرياضي",
    obGoalAthleticDesc: "تحسين السرعة والمرونة والقوة.",
    obExp: "الخبرة",
    obExpLevel: "مستوى اللياقة الحالي",
    obExpBeg: "مبتدئ",
    obExpBegDesc: "جديد في التدريب أو عائد بعد انقطاع طويل.",
    obExpInt: "متوسط",
    obExpIntDesc: "تدريب مستمر لأكثر من 6 أشهر.",
    obExpAdv: "متقدم",
    obExpAdvDesc: "تدريب مستمر لأكثر من سنتين.",

    // Equipment
    eqTitle: "إنهاء خطتك",
    eqSubtitle: "تخصيص البروتوكول ليناسب حياتك.",
    eqAccess: "المعدات المتاحة",
    eqGym: "نادي رياضي شامل",
    eqGymDesc: "وصول كامل للأجهزة والأوزان الحرة.",
    eqHome: "نادي منزلي",
    eqHomeDesc: "قفص، مقعد، ومعدات بار.",
    eqDumbbells: "دمبل فقط",
    eqDumbbellsDesc: "توفر محدود للمعدات.",
    eqBodyweight: "وزن الجسم",
    eqBodyweightDesc: "لا حاجة لمعدات.",
    eqDays: "أيام التدريب",
    eqLimitations: "القيود الجسدية (الإصابات)",
    eqNone: "لا يوجد",
    eqShoulder: "كتف",
    eqKnee: "ركبة",
    eqBack: "أسفل الظهر",
    eqWrist: "معصم",
    eqBio: "البيانات الحيوية (اختياري)",
    eqInbody: "فحص InBody",
    eqInbodyDesc: "ارفع تقريرك للحصول على دقة عالية.",
    eqUpload: "رفع ملف",
    eqSynced: "تم المزامنة",
    eqGenerate: "إنشاء الخطة",

    // Dashboard
    welcome: "مرحباً",
    overview: "نظرة عامة",
    nutrition: "التغذية",
    analytics: "التحليلات",
    week: "الأسبوع",
    sending: "جاري الإرسال...",
    reportSent: "تم الإرسال",
    weeklyStatus: "تقرير أسبوعي",
    reportInjury: "إبلاغ عن إصابة",
    coachBrief: "ملخص المدرب",
    phase: "المرحلة: التراكم",
    rest: "راحة",
    exercises: "تمارين",
    sets: "مجموعات",
    reps: "تكرارات",
    dailyCalories: "السعرات اليومية",
    proteinTarget: "هدف البروتين",
    recommendedFuel: "الوقود الموصى به",
    projectedWeight: "الوزن المتوقع",
    milestones: "المحطات الرئيسية",
    timeline: "الجدول الزمني",
    focus: "التركيز",
    weekFocus: "تضخيم العضلات",
    finishWeek: "إتمام الأسبوع",
    finishProgram: "إتمام البرنامج",
    finishWeekRequirements: "أكمل جميع التمارين والوجبات للمتابعة",

    // Meal Scanner
    scanMeal: "مسح الوجبة",
    scanDesc: "تحليل السعرات الحرارية والعناصر الغذائية.",
    analyzing: "جاري التحليل...",
    verdictApproved: "معتمد",
    verdictCaution: "تنبيه",
    verdictRejected: "مرفوض",
    replaceWith: "استبدل بـ",
    harmWarning: "تم اكتشاف تأثير ضار",

    // Profile & Credits
    creditBalance: "رصيد الكريدت",
    getCredits: "شراء كريدت",
    premiumUpgrade: "ترقية لبريميوم",
    premiumDesc: "أطلق العنان لإمكانياتك مع الباقة النخبوية.",
    manageSub: "إدارة الاشتراك",
    startPremium: "بدء باقة بريميوم",
    purchase: "شراء",
    currentPlan: "الخطة الحالية",
    freeTier: "المستوى القياسي",
    premiumTier: "المستوى النخبوي",
    memberSince: "عضو منذ",
    biometrics: "البيانات الحيوية",
    bmi: "مؤشر كتلة الجسم",

    // Visualizer Muscles
    muscles: {
        traps: "عضلات الرقبة",
        shoulders: "الأكتاف",
        chest: "الصدر",
        abs: "البطن",
        lats: "الظهر (المجنص)",
        obliques: "الخواصر",
        arms: "الذراعين",
        forearms: "الساعدين",
        legs: "الأفخاذ",
        calves: "السمانة",
        glutes: "المؤخرة",
        waist: "الخصر / أسفل الظهر"
    },
    muscleFunctions: {
        traps: "رفع اللوح",
        shoulders: "التبعيد/الثني",
        chest: "التقريب",
        abs: "ثبات الجذع",
        lats: "السحب/التقريب",
        obliques: "الدوران",
        arms: "الثني/المد",
        forearms: "قوة القبضة",
        legs: "مد الركبة",
        calves: "ثني أخمصي",
        glutes: "مد الورك",
        waist: "ثبات العمود الفقري"
    },

    // Calibration
    calibTitle: "المعايرة",
    calibDescCurrent: "تحديد خط الأساس الفسيولوجي الحالي.",
    calibDescTarget: "تحديد الأهداف المثالية. الطبقة النشطة.",
    calibCurrent: "الحالي",
    calibTarget: "الهدف",
    calibComp: "التركيب",
    calibMuscle: "تطور العضلات",
    calibBodyFat: "نسبة الدهون %",
    calibGenProto: "إنشاء البروتوكول"
  }
};

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  toggleTheme: () => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (val: boolean) => void;
  reminderTime: string;
  setReminderTime: (val: string) => void;
  hydrationEnabled: boolean;
  setHydrationEnabled: (val: boolean) => void;
  hydrationInterval: number; // In hours
  setHydrationInterval: (val: number) => void;
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<void>;
  t: (key: keyof typeof translations['en']) => any;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('physique_lang') as Language) || 'en');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('physique_theme') === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('physique_notif_enabled') === 'true');
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem('physique_notif_time') || '08:00');
  const [hydrationEnabled, setHydrationEnabled] = useState(() => localStorage.getItem('physique_hydration_enabled') === 'true');
  const [hydrationInterval, setHydrationInterval] = useState(() => parseInt(localStorage.getItem('physique_hydration_interval') || '2'));
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('physique_lang', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('physique_theme', darkMode ? 'dark' : 'light');
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('physique_notif_enabled', notificationsEnabled.toString());
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('physique_notif_time', reminderTime);
  }, [reminderTime]);

  useEffect(() => {
    localStorage.setItem('physique_hydration_enabled', hydrationEnabled.toString());
  }, [hydrationEnabled]);

  useEffect(() => {
    localStorage.setItem('physique_hydration_interval', hydrationInterval.toString());
  }, [hydrationInterval]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const t = (key: keyof typeof translations['en']) => {
      const translation = translations[language][key] || translations['en'][key] || key;
      return translation;
  };

  return (
    <SettingsContext.Provider value={{ 
        language, setLanguage, darkMode, toggleTheme, 
        notificationsEnabled, setNotificationsEnabled,
        reminderTime, setReminderTime,
        hydrationEnabled, setHydrationEnabled,
        hydrationInterval, setHydrationInterval,
        notificationPermission, requestNotificationPermission,
        t, 
        isSettingsOpen, openSettings: () => setIsSettingsOpen(true), closeSettings: () => setIsSettingsOpen(false) 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};