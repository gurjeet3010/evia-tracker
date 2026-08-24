import type { Phase, TrackingFor } from "./cycle";

export type MovementIntensity = "restorative" | "low" | "moderate" | "high";

export type PhaseSyncGuidance = {
  phase: Phase;
  title: string;
  tagline: string;
  energyPercent: number;
  energyLabel: string;
  hormones: string;
  nutrition: {
    keyNutrients: string[];
    focusFoods: string[];
    avoidMinimize: string[];
    summary: string;
  };
  movement: {
    type: string;
    intensity: MovementIntensity;
    summary: string;
    activities: string[];
  };
  selfCare: string;
  partnerTip: string;
};

export const CYCLE_SYNCING_DATA: Record<Phase, PhaseSyncGuidance> = {
  period: {
    phase: "period",
    title: "Menstrual Phase",
    tagline: "Rest, replenish, and listen to your body",
    energyPercent: 30,
    energyLabel: "Low & Restorative",
    hormones: "Estrogen & Progesterone are at their lowest levels",
    nutrition: {
      keyNutrients: ["Iron", "Magnesium", "Vitamin C", "Omega-3"],
      focusFoods: [
        "Warm stews & soups",
        "Spinach & leafy greens",
        "Beets & berries",
        "Dark chocolate",
        "Herbal teas (Chamomile, Ginger)",
      ],
      avoidMinimize: ["Ice-cold beverages", "Excess sodium", "Refined sugars"],
      summary: "Prioritize nutrient-dense, warm, easy-to-digest foods rich in iron to replenish blood loss.",
    },
    movement: {
      type: "Gentle Movement & Rest",
      intensity: "restorative",
      summary: "Light movement to ease cramping and boost circulation without causing fatigue.",
      activities: ["Yin Yoga", "Leisurely Walking", "Light Stretching", "Breathwork"],
    },
    selfCare: "Take warm baths, use a heating pad, and give yourself permission to rest without guilt.",
    partnerTip: "Offer warm meals, bring a hot water bottle, and take care of daily chores without asking.",
  },
  follicular: {
    phase: "follicular",
    title: "Follicular Phase",
    tagline: "Energy is rising — perfect for new ideas & active movement",
    energyPercent: 70,
    energyLabel: "Steadily Rising",
    hormones: "Estrogen begins to rise as follicles mature",
    nutrition: {
      keyNutrients: ["B-Vitamins", "Vitamin E", "Probiotics", "Zinc"],
      focusFoods: [
        "Fermented foods (Kimchi, Yogurt)",
        "Fresh salads & sprouts",
        "Lean proteins (Chicken, Fish)",
        "Oats & quinoa",
        "Avocados & seeds (Pumpkin, Flax)",
      ],
      avoidMinimize: ["Heavy, overly processed meals"],
      summary: "Focus on fresh, vibrant foods that support estrogen metabolism and gut health.",
    },
    movement: {
      type: "Cardio & Strength Building",
      intensity: "moderate",
      summary: "As stamina increases, incorporate upbeat cardio and new workout routines.",
      activities: ["Light Jogging", "Pilates", "Vinyasa Flow", "Moderate Cycling"],
    },
    selfCare: "Channel your rising motivation into planning goals, trying new hobbies, or creative outlets.",
    partnerTip: "Plan fun dates, encourage new activities, and share in their growing energy.",
  },
  fertile: {
    phase: "fertile",
    title: "Fertile Window",
    tagline: "Vibrant energy, heightened focus, and peak vitality",
    energyPercent: 85,
    energyLabel: "High Energy & Vitality",
    hormones: "Estrogen reaches high levels, stimulating LH release",
    nutrition: {
      keyNutrients: ["Fiber", "Antioxidants", "Glutathione", "Healthy Fats"],
      focusFoods: [
        "Cruciferous veggies (Broccoli, Brussels sprouts)",
        "Wild salmon & walnuts",
        "Fresh berries & pomegranate",
        "Chia & hemp seeds",
        "Hydrating coconut water",
      ],
      avoidMinimize: ["Excess alcohol", "Ultra-processed snacks"],
      summary: "Eat antioxidant-rich foods and fiber to help process high estrogen smoothly.",
    },
    movement: {
      type: "Dynamic Training & Social Fitness",
      intensity: "high",
      summary: "Capitalize on high stamina with group classes, strength sessions, or endurance training.",
      activities: ["HIIT", "Group Fitness", "Weight Training", "Running"],
    },
    selfCare: "Schedule important meetings, social gatherings, or collaborative brainstorming sessions.",
    partnerTip: "Be open, engaging, and plan romantic or high-energy social outings together.",
  },
  ovulation: {
    phase: "ovulation",
    title: "Ovulation Phase",
    tagline: "Peak hormonal surge & maximum social confidence",
    energyPercent: 100,
    energyLabel: "Peak Performance",
    hormones: "LH & Estrogen peak; Testosterone surges briefly",
    nutrition: {
      keyNutrients: ["Glutathione", "Magnesium", "Vitamin C", "Calcium"],
      focusFoods: [
        "Fresh leafy greens",
        "Berries & citrus fruits",
        "Raw veggies & dips",
        "Quinoa & legumes",
        "Green tea & water",
      ],
      avoidMinimize: ["Heavy, inflammatory fried foods"],
      summary: "Light, hydrating, and raw or lightly steamed foods support peak metabolic performance.",
    },
    movement: {
      type: "Peak Power & High Intensity",
      intensity: "high",
      summary: "Your strength and confidence are at their highest. Push for personal records safely.",
      activities: ["Heavy Lifting", "Interval Sprints", "Dance Cardio", "Power Yoga"],
    },
    selfCare: "Take advantage of peak communication skills and high confidence to present ideas or network.",
    partnerTip: "Celebrate their peak energy, offer praise, and enjoy deep quality time.",
  },
  luteal: {
    phase: "luteal",
    title: "Luteal Phase",
    tagline: "Winding down — shift focus to grounding & blood sugar balance",
    energyPercent: 55,
    energyLabel: "Winding Down",
    hormones: "Progesterone rises while Estrogen dips gradually",
    nutrition: {
      keyNutrients: ["Magnesium", "Vitamin B6", "Complex Carbs", "Fiber"],
      focusFoods: [
        "Sweet potatoes & squash",
        "Roasted root vegetables",
        "Pumpkin & sunflower seeds",
        "Brown rice & oats",
        "Dark chocolate (70%+)",
      ],
      avoidMinimize: ["Refined sugars", "High caffeine", "Alcohol"],
      summary: "Stable blood sugar is key. Enjoy complex carbs and magnesium-rich foods to curb cravings.",
    },
    movement: {
      type: "Grounding Strength & Pilates",
      intensity: "moderate",
      summary: "Transition from high impact to steady, grounding strength and core stability work.",
      activities: ["Mat Pilates", "Steady Weight Training", "Power Walking", "Hatha Yoga"],
    },
    selfCare: "Organize your space, practice boundary setting, and schedule quiet relaxing evenings.",
    partnerTip: "Provide a soothing environment, listen empathetically, and avoid over-scheduling weekend plans.",
  },
  pms: {
    phase: "pms",
    title: "PMS Phase",
    tagline: "Be gentle with yourself as progesterone & estrogen drop",
    energyPercent: 40,
    energyLabel: "Low & Sensitive",
    hormones: "Both Estrogen & Progesterone plummet right before menstruation",
    nutrition: {
      keyNutrients: ["Magnesium", "Calcium", "Vitamin B6", "Tryptophan"],
      focusFoods: [
        "Bananas & oats",
        "Warm chamomile & peppermint tea",
        "Dark chocolate & nuts",
        "Steamed greens",
        "Whole grain toast with nut butter",
      ],
      avoidMinimize: ["Caffeine (triggers anxiety)", "Salty foods (worsens bloating)", "Alcohol"],
      summary: "Choose comforting, easy-to-digest foods that boost serotonin and reduce fluid retention.",
    },
    movement: {
      type: "Restorative & Low Impact",
      intensity: "low",
      summary: "Avoid high stress workouts. Choose restorative movement that reduces cortisol.",
      activities: ["Restorative Yoga", "Gentle Strolls", "Foam Rolling", "Guided Meditation"],
    },
    selfCare: "Prioritize extra sleep, wear comfortable clothes, and minimize stressful commitments.",
    partnerTip: "Be extra patient and understanding, prepare comforting snacks, and avoid taking mood shifts personally.",
  },
};

export function getPhaseGuidance(phase: Phase, trackingFor: TrackingFor = "self"): PhaseSyncGuidance {
  const guidance = CYCLE_SYNCING_DATA[phase] || CYCLE_SYNCING_DATA.follicular;
  if (trackingFor === "partner") {
    return {
      ...guidance,
      selfCare: guidance.partnerTip,
    };
  }
  return guidance;
}
