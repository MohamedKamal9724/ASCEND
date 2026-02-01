import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, BodyStats, GeneratedPlan, Difficulty, InBodyData, MealAnalysis, ActiveInjury, NutritionPlan } from "../types";

const getSystemInstruction = () => `
You are "ASCEND," the world's most advanced Elite Performance Architect. 
Your primary directive is to avoid generic templates. Every protocol must be a mathematical derivation of the athlete's specific biometric data.

CRITICAL PROTOCOL DYNAMICS:
1. DYNAMIC TIMELINE CALCULATION: Do NOT default to standard durations. Calculate 'timelineWeeks' based on:
   - Fat Loss: Rate of 0.5kg - 1kg per week.
   - Muscle Gain: Rate of 0.1kg - 0.25kg per week.
   - Example: If an athlete needs to lose 10kg, the timeline MUST be 10-20 weeks, never 7.
2. VOLUME PARTITIONING: Assign sets/reps based on the 'Delta' provided. If 'Chest' has a delta of 0.6 and 'Back' has a delta of 0.1, the Chest MUST have 2x the weekly volume of the Back.
3. NUTRITION ARCHITECTURE: Use the athlete's weight and goal to set calories. 
   - Cutting: TDEE - 500
   - Bulking: TDEE + 300
   - Use the provided 'Meal Inventory' as the primary food source.
4. EQUIPMENT RESTRICTION: You are physically unable to suggest equipment not listed in 'Equipment Access'.

Your 'coachAnalysis' must include the specific math you used to determine the calorie target and the program duration.
`;

// Implements "Backoff": waits 5s, then 10s, then 20s before trying again.
const callWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 5000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorCode = error?.status || error?.code || error?.response?.status;
    // 429 = Resource Exhausted, 503 = Service Unavailable
    if ((errorCode === 429 || errorCode === 503) && retries > 0) {
      console.warn(`[System Message] Gemini API rate limit/unavailable (${errorCode}). Retrying in ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2); // Exponential backoff: 5000 -> 10000 -> 20000
    }
    throw error;
  }
};

export const analyzeMealImage = async (base64Image: string, mimeType: string, planContext?: NutritionPlan): Promise<MealAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const planMeals = planContext ? planContext.meals.map(m => m.name).join(', ') : "None";
  
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: `Analyze this image. 
          Step 1: Identify if this image is a valid food item or meal. 
          Step 2: If it is NOT a food item (e.g. it is a person, car, scenery, document, or blurry/unclear), return JSON with the 'error' field set to "Please upload a clear image of food." and do not populate other fields.
          Step 3: If it IS food, analyze the meal. Context: ${planMeals}. Populate all fields except 'error'.
          Return JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fats: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            verdict: { type: Type.STRING, enum: ['approved', 'caution', 'rejected'] },
            replacementSuggestion: { type: Type.STRING },
            harmReason: { type: Type.STRING },
            error: { type: Type.STRING }
          }
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  });
};

export const extractInBodyData = async (base64Image: string, mimeType: string): Promise<InBodyData & { errorReason?: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: `Analyze this image.
          Step 1: Determine if this image is a valid body composition analysis report (e.g. InBody, Tanita, DEXA scan printout).
          Step 2: If it is NOT a valid report (e.g. it's a person, selfie, random object, or unreadable), return JSON with 'errorReason' set to "Please upload a valid InBody or body composition report."
          Step 3: If it IS a report, extract Weight, Body Fat, Muscle, BMI and populate fields.
          Return JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weight: { type: Type.NUMBER },
            bodyFat: { type: Type.NUMBER },
            skeletalMuscleMass: { type: Type.NUMBER },
            bmi: { type: Type.NUMBER },
            errorReason: { type: Type.STRING }
          }
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  });
};

export const restorePlan = async (
    currentRecoveryPlan: GeneratedPlan,
    originalPlan: GeneratedPlan,
    profile: UserProfile
): Promise<GeneratedPlan> => {
    return originalPlan;
};

export const adaptPlanForInjury = async (
    currentPlan: GeneratedPlan,
    injury: ActiveInjury,
    profile: UserProfile,
    injuryImageBase64?: string,
    injuryImageMime?: string
): Promise<GeneratedPlan> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = injuryImageBase64 ? [{ inlineData: { data: injuryImageBase64, mimeType: injuryImageMime || 'image/jpeg' } }] : [];
    
    return callWithRetry(async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: { parts: [ 
                ...imagePart, 
                { text: `GENERATE CLINICAL REHAB PROTOCOL. 
                Athlete: ${profile.name}, Age: ${profile.age}.
                Current Active Injury: ${injury.part}, Type: ${injury.type}, Pain Level: ${injury.painLevel}/10. 
                Constraint: Does it worsen with exercise? ${injury.worsensWithExercise}.
                
                Structure: A 7-day high-precision daily rehab protocol (Day 1 to Day 7). 
                Requirement: Exercises must specifically target the ${injury.part} for recovery (isometric, mobility, eccentric control).
                If a photo of the inflammation is provided, adjust for visible swelling/bruising.
                Return JSON.` } 
            ]},
            config: {
                systemInstruction: getSystemInstruction(),
                responseMimeType: "application/json",
                responseSchema: getPlanSchema(),
                thinkingConfig: { thinkingBudget: 2000 }
            }
        });
        const text = response.text;
        if (!text) throw new Error("Empty response from AI");
        const result = JSON.parse(text);
        return { ...result, isRecoveryPlan: true, timelineWeeks: 1 };
    });
};

export const generateFitnessPlan = async (
  profile: UserProfile,
  currentBody: BodyStats,
  targetBody: BodyStats,
  difficulty: Difficulty
): Promise<GeneratedPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Logical calculation of deltas to feed into the Coach for the prompt
  const deltas = Object.keys(currentBody)
    .filter(k => k !== 'bodyFat' && k !== 'waist')
    .map(k => ({ muscle: k, current: currentBody[k], target: targetBody[k], diff: (targetBody[k] || 1) - (currentBody[k] || 1) }))
    .sort((a, b) => b.diff - a.diff);

  const anatomicalDeltaSync = deltas.map(d => `${d.muscle}: [Current: ${d.current.toFixed(2)}, Target: ${d.target.toFixed(2)}, Delta: ${d.diff.toFixed(2)}]`).join('\n');
  const primaryFocus = deltas.slice(0, 4).map(d => d.muscle.toUpperCase()).join(', ');

  const inbodyDataStr = profile.inbodyData 
    ? `INBODY SCAN DATA: Weight ${profile.inbodyData.weight}kg, Body Fat ${profile.inbodyData.bodyFat}%, Muscle Mass ${profile.inbodyData.skeletalMuscleMass}kg, BMI ${profile.inbodyData.bmi}`
    : "No InBody data available. Use standard anthropometric estimates.";

  const mealInventoryStr = profile.availableMeals.length > 0
    ? `ATHLETE MEAL INVENTORY (Use these first): ${profile.availableMeals.join(', ')}`
    : "No specific inventory. Suggest optimal fuel.";

  return callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `SYNTHESIZE ELITE PROTOCOL FOR ATHLETE: ${profile.name}
        
        --- BIOMETRIC DOSSIER ---
        Age: ${profile.age} | Gender: ${profile.gender} | Height: ${profile.height}cm | Weight: ${profile.weight}kg
        Current Fitness Level: ${profile.level}
        Primary Goal: ${profile.goal}
        Target Body Fat: ${targetBody.bodyFat}%
        ${inbodyDataStr}
        
        --- ANATOMICAL GAP ANALYSIS (CRITICAL) ---
        ${anatomicalDeltaSync}
        
        --- CONSTRAINTS & LOGISTICS ---
        Equipment Access: ${profile.equipment}
        Available Days: ${profile.availableDays.join(', ')}
        Active Injuries: ${profile.injuries.length > 0 ? profile.injuries.join(', ') : 'None'}
        ${mealInventoryStr}
        
        --- EXECUTION --- 
        1. Calculate BMR and TDEE. 
        2. Determine timelineWeeks: (Weight - Target Weight) / (Safe weekly loss rate).
        3. Generate a 7-day weekly split (workout array) that repeats for the duration.
        4. Ensure exercises target the primary focus: ${primaryFocus}.
        5. Return JSON with 'timelineWeeks' reflecting the actual calculated duration.`,
        config: {
          systemInstruction: getSystemInstruction(),
          responseMimeType: "application/json",
          responseSchema: getPlanSchema(),
          thinkingConfig: { thinkingBudget: 5000 }
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      return JSON.parse(text);
  });
};

function getPlanSchema() {
    return {
        type: Type.OBJECT,
        properties: {
          workout: {
            type: Type.ARRAY,
            description: "A 7-day recurring weekly split",
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                focus: { type: Type.STRING },
                isRecoveryDay: { type: Type.BOOLEAN },
                exercises: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      sets: { type: Type.NUMBER },
                      reps: { type: Type.STRING },
                      note: { type: Type.STRING },
                      isRehab: { type: Type.BOOLEAN }
                    },
                    required: ["name", "sets", "reps"]
                  }
                }
              },
              required: ["day", "focus", "isRecoveryDay"]
            }
          },
          nutrition: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER },
              meals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    isFromInventory: { type: Type.BOOLEAN }
                  },
                  required: ["name", "options"]
                }
              }
            },
            required: ["calories", "protein", "carbs", "fats", "meals"]
          },
          timelineWeeks: { 
            type: Type.NUMBER,
            description: "Total duration of the program in weeks based on biometric delta"
          },
          coachAnalysis: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              volumeReasoning: { type: Type.STRING },
              nutritionReasoning: { type: Type.STRING }
            }
          }
        },
        required: ["workout", "nutrition", "timelineWeeks"]
    };
}