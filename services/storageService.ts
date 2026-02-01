import { UserProfile, BodyStats, GeneratedPlan, PromoCode } from '../types';

// --- DATA STRUCTURES ---

export interface UserProgress {
  currentWeek: number;
  completedWeeks: number[];
  completedExercises: Record<string, boolean>; // Key: "week-day-exerciseIndex"
  completedNutrition: Record<string, boolean>;
}

export interface ActionLog {
  id: string;
  timestamp: number;
  type: 'UPDATE_PROFILE' | 'UPDATE_BODY' | 'GENERATE_PLAN' | 'COMPLETE_WORKOUT' | 'RESET_PROGRESS' | 'REDEEM_PROMO';
  payload: any;
}

export interface UserData {
  id: string;
  version: number; 
  lastSynced: string;
  
  profile: UserProfile;
  currentBody: BodyStats;
  targetBody: BodyStats;
  plan: GeneratedPlan | null;
  progress: UserProgress;
  
  history: ActionLog[]; 
}

const STORAGE_PREFIX = 'physique_v2_';
const GLOBAL_PROMO_KEY = 'physique_v2_global_promos';

// --- CORE FUNCTIONS ---

export const getStorageKey = (userId: string) => `${STORAGE_PREFIX}${userId}`;

export const createInitialState = (userId: string): UserData => ({
  id: userId,
  version: 1,
  lastSynced: new Date().toISOString(),
  profile: {
      redeemedCodes: [],
      joinDate: new Date().toISOString()
  } as unknown as UserProfile, 
  currentBody: {} as BodyStats,
  targetBody: {} as BodyStats,
  plan: null,
  progress: {
    currentWeek: 1,
    completedWeeks: [],
    completedExercises: {},
    completedNutrition: {}
  },
  history: []
});

export const commitAction = (
  userId: string, 
  actionType: ActionLog['type'], 
  payload: any, 
  mutator: (data: UserData) => void
) => {
  try {
    const key = getStorageKey(userId);
    const existingStr = localStorage.getItem(key);
    
    let data: UserData;
    if (existingStr) {
      data = JSON.parse(existingStr);
    } else {
      data = createInitialState(userId);
    }

    mutator(data);

    const action: ActionLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: actionType,
      payload: JSON.parse(JSON.stringify(payload)) 
    };
    data.history.push(action);

    data.version += 1;
    data.lastSynced = new Date().toISOString();

    localStorage.setItem(key, JSON.stringify(data));
    return data;
  } catch (e) {
    console.error(`[Storage] Failed to commit ${actionType}`, e);
    throw e;
  }
};

export const loadUserData = (userId: string): UserData | null => {
  try {
    const key = getStorageKey(userId);
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load user data", e);
    return null;
  }
};

export const clearUserData = (userId: string) => {
    try {
        const key = getStorageKey(userId);
        localStorage.removeItem(key);
    } catch (e) {
        console.error("Failed to clear user data", e);
    }
};

// --- PROMO CODE MANAGEMENT ---

export const getGlobalPromos = (): PromoCode[] => {
    try {
        const raw = localStorage.getItem(GLOBAL_PROMO_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
};

export const saveGlobalPromos = (promos: PromoCode[]) => {
    localStorage.setItem(GLOBAL_PROMO_KEY, JSON.stringify(promos));
};

export const addGlobalPromo = (
    code: string, 
    value: number, 
    type: 'credits' | 'premium' | 'discount' = 'credits', 
    magnitudeType: 'fixed' | 'percentage' = 'fixed',
    maxUses?: number, 
    expiryDate?: string
) => {
    const promos = getGlobalPromos();
    const existing = promos.findIndex(p => p.code.toUpperCase() === code.toUpperCase());
    
    const newPromo: PromoCode = {
        code: code.toUpperCase(),
        value,
        type,
        magnitudeType,
        uses: 0,
        maxUses,
        expiryDate,
        createdAt: new Date().toISOString()
    };

    if (existing >= 0) {
        promos[existing] = { ...promos[existing], ...newPromo };
    } else {
        promos.push(newPromo);
    }
    saveGlobalPromos(promos);
};

export const incrementPromoUses = (code: string) => {
    const promos = getGlobalPromos();
    const idx = promos.findIndex(p => p.code === code.toUpperCase());
    if (idx >= 0) {
        promos[idx].uses += 1;
        saveGlobalPromos(promos);
    }
};

export const removeGlobalPromo = (code: string) => {
    const promos = getGlobalPromos();
    const filtered = promos.filter(p => p.code.toUpperCase() !== code.toUpperCase());
    saveGlobalPromos(filtered);
};

// --- HELPER MUTATORS ---

export const saveFullProfile = (userId: string, profile: UserProfile, currentBody: BodyStats, targetBody: BodyStats, plan?: GeneratedPlan) => {
  commitAction(userId, 'GENERATE_PLAN', { hasPlan: !!plan }, (data) => {
    data.profile = profile;
    data.currentBody = currentBody;
    data.targetBody = targetBody;
    if (plan) data.plan = plan;
  });
};

export const updateWorkoutProgress = (userId: string, workoutKey: string, isCompleted: boolean) => {
  commitAction(userId, 'COMPLETE_WORKOUT', { workoutKey, isCompleted }, (data) => {
    if (isCompleted) {
      data.progress.completedExercises[workoutKey] = true;
    } else {
      delete data.progress.completedExercises[workoutKey];
    }
  });
};