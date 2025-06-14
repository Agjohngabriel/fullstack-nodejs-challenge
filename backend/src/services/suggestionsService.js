const logger = require('../utils/logger');

class SuggestionsService {
  constructor() {
    // Mock peptide database - in production, this would be a real database
    this.peptideDatabase = {
      energy: [
        {
          name: "CJC-1295 with DAC",
          description: "A growth hormone releasing hormone analog that promotes natural energy production and vitality through improved sleep quality and recovery.",
          dosage: "2mg per week",
          timing: "Before bedtime",
          ageRecommendation: { min: 25, max: 65 },
          benefits: ["Increased energy", "Better sleep", "Enhanced recovery"]
        },
        {
          name: "Ipamorelin",
          description: "A selective growth hormone secretagogue that supports natural energy levels without affecting cortisol or prolactin levels.",
          dosage: "200-300mcg daily",
          timing: "Morning or pre-workout",
          ageRecommendation: { min: 20, max: 70 },
          benefits: ["Sustained energy", "Improved metabolism", "Fat loss support"]
        },
        {
          name: "MOTS-c",
          description: "A mitochondrial-derived peptide that enhances cellular energy production and metabolic efficiency.",
          dosage: "5-10mg twice weekly",
          timing: "Morning",
          ageRecommendation: { min: 30, max: 80 },
          benefits: ["Mitochondrial health", "Energy production", "Metabolic support"]
        }
      ],
      sleep: [
        {
          name: "DSIP (Delta Sleep-Inducing Peptide)",
          description: "A natural sleep-promoting peptide that helps regulate sleep cycles and improve sleep quality.",
          dosage: "100-200mcg",
          timing: "30 minutes before bedtime",
          ageRecommendation: { min: 18, max: 75 },
          benefits: ["Deep sleep", "Sleep cycle regulation", "Stress reduction"]
        },
        {
          name: "CJC-1295 with DAC",
          description: "Promotes deeper, more restorative sleep through growth hormone optimization, leading to better recovery.",
          dosage: "2mg per week",
          timing: "Before bedtime",
          ageRecommendation: { min: 25, max: 65 },
          benefits: ["Sleep quality", "Recovery", "Anti-aging"]
        },
        {
          name: "Glycine Peptide Complex",
          description: "A specialized peptide formulation that promotes relaxation and supports natural sleep patterns.",
          dosage: "1-3g",
          timing: "1 hour before bed",
          ageRecommendation: { min: 18, max: 85 },
          benefits: ["Relaxation", "Sleep onset", "Sleep maintenance"]
        }
      ],
      focus: [
        {
          name: "Noopept",
          description: "A nootropic peptide that enhances cognitive function, focus, and mental clarity through neuroprotective mechanisms.",
          dosage: "10-30mg daily",
          timing: "Morning with breakfast",
          ageRecommendation: { min: 18, max: 60 },
          benefits: ["Mental clarity", "Focus enhancement", "Memory support"]
        },
        {
          name: "Selank",
          description: "An anxiolytic peptide that reduces anxiety while enhancing cognitive performance and mental focus.",
          dosage: "150-300mcg daily",
          timing: "Morning",
          ageRecommendation: { min: 20, max: 65 },
          benefits: ["Anxiety reduction", "Cognitive enhancement", "Stress management"]
        },
        {
          name: "Cerebrolysin",
          description: "A neuropeptide complex that supports brain health, cognitive function, and neural plasticity.",
          dosage: "5-10ml per session",
          timing: "Morning",
          ageRecommendation: { min: 25, max: 70 },
          benefits: ["Neuroprotection", "Cognitive enhancement", "Brain health"]
        }
      ],
      recovery: [
        {
          name: "BPC-157",
          description: "A healing peptide that accelerates tissue repair, reduces inflammation, and supports overall recovery.",
          dosage: "250-500mcg daily",
          timing: "Post-workout or with meals",
          ageRecommendation: { min: 18, max: 80 },
          benefits: ["Tissue repair", "Inflammation reduction", "Injury recovery"]
        },
        {
          name: "TB-500 (Thymosin Beta-4)",
          description: "A regenerative peptide that promotes healing, reduces inflammation, and supports muscle and tissue recovery.",
          dosage: "2-5mg twice weekly",
          timing: "Post-workout",
          ageRecommendation: { min: 20, max: 75 },
          benefits: ["Muscle recovery", "Tissue regeneration", "Anti-inflammatory"]
        },
        {
          name: "IGF-1 LR3",
          description: "An insulin-like growth factor that supports muscle recovery, growth, and overall tissue repair.",
          dosage: "20-40mcg daily",
          timing: "Post-workout",
          ageRecommendation: { min: 21, max: 65 },
          benefits: ["Muscle growth", "Recovery acceleration", "Tissue repair"]
        }
      ],
      longevity: [
        {
          name: "Epitalon",
          description: "A telomerase-activating peptide that supports cellular longevity and anti-aging processes.",
          dosage: "5-10mg per cycle",
          timing: "Before bedtime",
          ageRecommendation: { min: 35, max: 85 },
          benefits: ["Anti-aging", "Cellular longevity", "Immune support"]
        },
        {
          name: "GHK-Cu",
          description: "A copper peptide complex that supports skin health, wound healing, and anti-aging processes.",
          dosage: "1-3mg daily",
          timing: "Morning",
          ageRecommendation: { min: 30, max: 80 },
          benefits: ["Skin health", "Collagen production", "Anti-aging"]
        },
        {
          name: "NAD+ Peptide Precursors",
          description: "Peptides that support NAD+ production for cellular energy, DNA repair, and longevity pathways.",
          dosage: "100-500mg daily",
          timing: "Morning",
          ageRecommendation: { min: 40, max: 85 },
          benefits: ["Cellular energy", "DNA repair", "Longevity support"]
        }
      ]
    };
  }

  /**
   * Get personalized suggestions based on age and goal
   * @param {number} age - User's age
   * @param {string} goal - Health goal category
   * @returns {Array} Array of suggestion objects
   */
  async getSuggestions(age, goal) {
    logger.info('Generating suggestions', { age, goal });
    
    const goalPeptides = this.peptideDatabase[goal] || [];
    
    if (goalPeptides.length === 0) {
      throw new Error(`No peptides found for goal: ${goal}`);
    }
    
    // Filter peptides based on age recommendations
    const ageSuitablePeptides = goalPeptides.filter(peptide => {
      const { min, max } = peptide.ageRecommendation;
      return age >= min && age <= max;
    });
    
    // If no age-suitable peptides, fall back to all peptides for the goal
    const selectedPeptides = ageSuitablePeptides.length > 0 
      ? ageSuitablePeptides 
      : goalPeptides;
    
    // Add personalized notes based on age group
    const personalizedSuggestions = selectedPeptides.map(peptide => ({
      ...peptide,
      personalizedNote: this.getPersonalizedNote(age, goal, peptide.name)
    }));
    
    // Sort by relevance (this could be more sophisticated)
    return personalizedSuggestions.slice(0, 3); // Return top 3 suggestions
  }
  
  /**
   * Get personalized note based on age and peptide
   * @param {number} age - User's age
   * @param {string} goal - Health goal
   * @param {string} peptideName - Name of the peptide
   * @returns {string} Personalized note
   */
  getPersonalizedNote(age, goal, peptideName) {
    const ageGroup = this.getAgeGroup(age);
    
    const personalizedNotes = {
      young: {
        energy: "At your age, focus on natural optimization rather than aggressive supplementation.",
        sleep: "Establishing good sleep hygiene is crucial for your age group.",
        focus: "Cognitive enhancement can provide significant benefits for productivity.",
        recovery: "Your natural recovery is still strong, use this to enhance performance.",
        longevity: "Starting early with longevity protocols can provide long-term benefits."
      },
      middle: {
        energy: "This peptide can help counteract age-related energy decline.",
        sleep: "Sleep quality often decreases with age - this can help restore it.",
        focus: "Cognitive support becomes increasingly important in your 40s-50s.",
        recovery: "Recovery time increases with age - this can help maintain performance.",
        longevity: "This is an optimal age to begin serious anti-aging interventions."
      },
      mature: {
        energy: "Energy optimization is crucial for maintaining vitality at your age.",
        sleep: "Quality sleep becomes even more important for health and recovery.",
        focus: "Cognitive support can help maintain mental sharpness and clarity.",
        recovery: "Enhanced recovery support is essential for maintaining activity levels.",
        longevity: "Anti-aging peptides can significantly impact quality of life."
      }
    };
    
    return personalizedNotes[ageGroup]?.[goal] || "Consult with a healthcare provider for personalized guidance.";
  }
  
  /**
   * Categorize age into groups
   * @param {number} age - User's age
   * @returns {string} Age group category
   */
  getAgeGroup(age) {
    if (age < 35) return 'young';
    if (age < 55) return 'middle';
    return 'mature';
  }
  
  /**
   * Get all available health goals
   * @returns {Array} Array of available goals
   */
  getAvailableGoals() {
    return [
      { value: 'energy', label: 'Energy & Vitality', description: 'Boost natural energy and vitality' },
      { value: 'sleep', label: 'Better Sleep', description: 'Improve sleep quality and recovery' },
      { value: 'focus', label: 'Mental Focus', description: 'Enhance cognitive performance and clarity' },
      { value: 'recovery', label: 'Muscle Recovery', description: 'Accelerate healing and tissue repair' },
      { value: 'longevity', label: 'Anti-Aging', description: 'Support longevity and healthy aging' }
    ];
  }
}

module.exports = new SuggestionsService();