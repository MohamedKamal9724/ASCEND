
export type Gender = 'male' | 'female';
export type Goal = 'fat_loss' | 'muscle_gain' | 'recomp' | 'athletic';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Difficulty = 'easy' | 'balanced' | 'hard';

export type Equipment = 'gym_full' | 'dumbbells_only' | 'bodyweight' | 'home_gym';
export type Injury = 'shoulder' | 'knee' | 'lower_back' | 'wrist' | 'none';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';
export type AuthProviderType = 'email' | 'google' | 'apple';

// --- ECONOMY ---
export const INITIAL_CREDITS = 100;

export const CREDIT_COSTS = {
    GENERATE_PLAN: 25,
    UNLOCK_WEEK: 15,
    SEND_REPORT: 5,
    UPDATE_TARGET_BODY: 5,
    COACH_ANALYSIS: 5,
    MEAL_SCAN: 5
};

export interface InBodyData {
  weight: number;
  bodyFat: number;
  skeletalMuscleMass?: number;
  bmi?: number;
  date?: string;
  pbf?: number; // Percent Body Fat
}

export interface MealAnalysis {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  summary: string;
  verdict: 'approved' | 'caution' | 'rejected';
  replacementSuggestion?: string; // Name of a meal from the plan
  harmReason?: string; // Why it was rejected
  error?: string; // For invalid image validation
}

export interface ActiveInjury {
  id: string;
  part: string; // e.g., 'Knee', 'Shoulder'
  type: 'pain' | 'strain' | 'sprain' | 'tear' | 'discomfort' | 'stiffness';
  painLevel: number; // 1-10
  dateOccurred: string;
  worsensWithExercise: boolean;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  recoveryPhase?: number;
}

export interface UserProfile {
  age: number;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  goal: Goal;
  level: Level;
  name: string;
  email?: string;
  equipment: Equipment;
  injuries: Injury[];
  activeInjuries?: ActiveInjury[]; 
  availableDays: string[]; 
  availableMeals: string[]; 
  inbodyData?: InBodyData;
  credits: number; 
  isPremium?: boolean; 
  redeemedCodes: string[]; 
  activeDiscount?: number; 
  joinDate?: string;
  isRecoveryMode?: boolean;
  originalPlan?: GeneratedPlan; // Paused plan
  originalWeek?: number; // Paused week
}

export interface BodyStats {
  traps: number;
  shoulders: number;
  chest: number;
  arms: number;
  forearms: number;
  abs: number; 
  waist: number;
  glutes: number;
  legs: number; 
  calves: number;
  bodyFat: number; 
  [key: string]: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  note?: string;
  completed?: boolean; 
  isRehab?: boolean; 
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: Exercise[];
  completed?: boolean; 
  isRecoveryDay?: boolean; 
}

export interface NutritionPlan {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meals: {
    name: string;
    options: string[];
    isFromInventory?: boolean; 
  }[];
}

export interface CoachAnalysis {
  summary: string; 
  volumeReasoning: string; 
  nutritionReasoning: string; 
  realismAdjustment?: string; 
  injuryAdjustment?: string; 
  mealInventoryFeedback?: string;
}

export interface GeneratedPlan {
  workout: WorkoutDay[];
  nutrition: NutritionPlan;
  timelineWeeks: number;
  milestones: { week: number; description: string; expectedWeight: number }[];
  coachAnalysis: CoachAnalysis;
  isRecoveryPlan?: boolean;
}

export type AppView = 'onboarding' | 'calibration' | 'constraints' | 'dashboard' | 'founder_dashboard';

export type VisualizerMode = 'standard' | 'thermal' | 'scan';

export interface DashboardProps {
  plan: GeneratedPlan;
  userProfile: UserProfile;
  currentBody: BodyStats;
  onReset: () => void;
  initialDifficulty: Difficulty;
}

export interface PromoCode {
    code: string;
    value: number; 
    type: 'credits' | 'premium' | 'discount';
    magnitudeType: 'fixed' | 'percentage';
    uses: number;
    maxUses?: number;
    expiryDate?: string;
    createdAt: string;
}
