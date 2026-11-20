import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { AQIReading, HouseholdProfile, Recommendation, AIMessage, RecommendationContext } from '@/types';
import { getAQICategory } from '@/types';
import { generateRecommendations } from '@/lib/recommendations/engine';
import { getIndoorGuidance } from '@/lib/indoor/advisor';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT_EN = `You are SmogShield AI, a helpful air quality assistant for families in Indian cities.

CORE PRINCIPLES:
1. NEVER invent or hallucinate AQI readings, pollutant levels, or health data
2. NEVER give medical advice - always recommend consulting healthcare professionals
3. ALWAYS ground answers in provided data or cite "general knowledge"
4. Clearly disclose when data is stale, cached, or from demo sources
5. Defer to deterministic recommendation engine for safety-critical guidance
6. Be concise, practical, and family-friendly
7. Support both English and Hindi

RESPONSE FORMAT:
- Direct answer first
- Supporting data/context
- Actionable recommendation if applicable
- Limitations/caveats
- "Data source: [source]" or "Based on general guidelines"

If asked about current AQI but no data provided: "I don't have live data for that location right now. Please check the dashboard for latest readings."

If asked for medical advice: "I cannot provide medical advice. Please consult a healthcare professional for health concerns related to air pollution."`;

const SYSTEM_PROMPT_HI = `आप SmogShield AI हैं, भारतीय शहरों में परिवारों के लिए एक सहायक वायु गुणवत्ता सहायक।

मुख्य सिद्धांत:
1. कभी भी AQI रीडिंग, प्रदूषक स्तर, या स्वास्थ्य डेटा न बनाएं
2. कभी चिकित्सा सलाह न दें - हमेशा स्वास्थ्य पेशेवर से परामर्श करने को कहें
3. हमेशा प्रदान किए गए डेटा पर आधारित उत्तर दें या "सामान्य ज्ञान" का हवाला दें
4. स्पष्ट रूप से बताएं जब डेटा पुराना, कैश्ड, या डेमो स्रोत से हो
5. सुरक्षा-महत्वपूर्ण मार्गदर्शन के लिए निश्चित अनुशंसा इंजन पर भरोसा करें
6. संक्षिप्त, व्यावहारिक, और परिवार-अनुकूल रहें
7. अंग्रेजी और हिंदी दोनों का समर्थन करें`;

interface AIContext {
  aqi?: AQIReading;
  profiles?: HouseholdProfile[];
  recommendations?: Recommendation[];
  language?: 'en' | 'hi';
}

function buildContextPrompt(context: AIContext): string {
  let prompt = '';

  if (context.aqi) {
    const cat = getAQICategory(context.aqi.aqi);
    prompt += `\nCURRENT AIR QUALITY (${context.aqi.dataFreshness}):\n`;
    prompt += `- Location: ${context.aqi.location.name}\n`;
    prompt += `- AQI: ${context.aqi.aqi} (${cat.label})\n`;
    if (context.aqi.pm25) prompt += `- PM2.5: ${context.aqi.pm25} μg/m³\n`;
    if (context.aqi.pm10) prompt += `- PM10: ${context.aqi.pm10} μg/m³\n`;
    prompt += `- Updated: ${context.aqi.timestamp}\n`;
    prompt += `- Source: ${context.aqi.source}\n`;
  }

  if (context.profiles && context.profiles.length > 0) {
    prompt += `\nHOUSEHOLD PROFILES:\n`;
    for (const p of context.profiles) {
      prompt += `- ${p.name}: ${p.category}, conditions: ${p.conditions.join(', ') || 'none'}, outdoor: ${p.outdoorFrequency}, purifier: ${p.hasAirPurifier ? 'yes' : 'no'}\n`;
    }
  }

  if (context.recommendations && context.recommendations.length > 0) {
    prompt += `\nTODAY'S RECOMMENDATIONS:\n`;
    for (const r of context.recommendations.slice(0, 5)) {
      prompt += `- [${r.priority}] ${r.action} (${r.category})\n`;
    }
  }

  return prompt;
}

export async function generateAIResponse(
  userMessage: string,
  context: AIContext,
  conversationHistory: AIMessage[] = []
): Promise<{ response: string; citations: string[] }> {
  if (!GEMINI_API_KEY) {
    return getFallbackResponse(userMessage, context);
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
    });

    const systemPrompt = context.language === 'hi' ? SYSTEM_PROMPT_HI : SYSTEM_PROMPT_EN;
    const contextPrompt = buildContextPrompt(context);

    const history = conversationHistory.slice(-6).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });
    const fullPrompt = `${systemPrompt}${contextPrompt}\n\nUSER: ${userMessage}\n\nRespond helpfully following the principles above.`;

    const result = await chat.sendMessage(fullPrompt);
    const response = result.response.text();

    // Extract citations from response (simple heuristic)
    const citations: string[] = [];
    if (context.aqi) citations.push(`${context.aqi.source} AQI data`);
    if (context.recommendations?.length) citations.push('SmogShield recommendation engine');
    citations.push('WHO Air Quality Guidelines', 'CPCB National Ambient Air Quality Standards');

    return { response, citations };
  } catch (error) {
    console.error('[AI Orchestrator] Gemini error:', error);
    return getFallbackResponse(userMessage, context);
  }
}

function getFallbackResponse(userMessage: string, context: AIContext): { response: string; citations: string[] } {
  const msg = userMessage.toLowerCase();
  const lang = context.language ?? 'en';
  const isHindi = lang === 'hi';

  // Generate deterministic recommendations if not provided
  let recs = context.recommendations;
  if (!recs && context.aqi && context.profiles) {
    const recContext: RecommendationContext = {
      aqi: context.aqi,
      profiles: context.profiles,
      plannedActivities: [],
      travelPatterns: [],
    };
    recs = generateRecommendations(recContext);
  }

  const indoorGuidance = context.profiles ? getIndoorGuidance(context.profiles, context.aqi) : [];

  // Pattern matching for common queries
  if (msg.includes('aqi') || msg.includes('air quality') || msg.includes('pollution') || msg.includes('हवा') || msg.includes('प्रदूषण')) {
    if (context.aqi) {
      const cat = getAQICategory(context.aqi.aqi);
      const freshness = context.aqi.dataFreshness;
      const freshnessLabel = isHindi
        ? freshness === 'live' ? 'लाइव' : freshness === 'cached' ? 'कैश्ड' : freshness === 'demo' ? 'डेमो' : 'पुराना'
        : freshness.charAt(0).toUpperCase() + freshness.slice(1);

      return {
        response: isHindi
          ? `**वर्तमान AQI:** ${context.aqi.aqi} (${cat.label})
**स्थान:** ${context.aqi.location.name}
**डेटा:** ${freshnessLabel} (${context.aqi.source})
**PM2.5:** ${context.aqi.pm25 ?? 'उपलब्ध नहीं'} μg/m³

${cat.description}

**आज की मुख्य सिफारिशें:**
${recs?.slice(0, 3).map(r => `• ${r.action}`).join('\n') || 'डैशबोर्ड देखें'}`
          : `**Current AQI:** ${context.aqi.aqi} (${cat.label})
**Location:** ${context.aqi.location.name}
**Data:** ${freshnessLabel} (${context.aqi.source})
**PM2.5:** ${context.aqi.pm25 ?? 'N/A'} μg/m³

${cat.description}

**Today's Key Recommendations:**
${recs?.slice(0, 3).map(r => `• ${r.action}`).join('\n') || 'Check dashboard'}`,
        citations: [`${context.aqi.source} AQI data`, 'SmogShield recommendation engine'],
      };
    }
    return {
      response: isHindi
        ? 'मेरे पास अभी उस स्थान के लिए लाइव AQI डेटा नहीं है। कृपया डैशबोर्ड पर नवीनतम रीडिंग देखें।'
        : 'I don\'t have live AQI data for that location right now. Please check the dashboard for latest readings.',
      citations: [],
    };
  }

  if (msg.includes('indoor') || msg.includes('घर') || msg.includes('प्यूरीफायर') || msg.includes('purifier') || msg.includes('ventilat') || msg.includes('हवादार')) {
    const guidance = indoorGuidance.filter(g => g.category === 'filtration' || g.category === 'ventilation' || g.category === 'source_control');
    return {
      response: isHindi
        ? `**घर के अंदर हवा सुरक्षा:**

**स्रोत नियंत्रण (आवश्यक):**
• धूम्रपान, अगरबत्ती, मोमबत्ती, मोसक्विटो कॉइल न जलाएं
• खाना पकाते समय एग्जॉस्ट फैन चलाएं

**प्यूरीफायर:**
• ट्रू HEPA (H13/H14) चुनें, CADR ≥ कमरे के आयतन का 2/3
• बेडरूम और लिविंग रूम में रखें, दरवाजे-खिड़कियां बंद रखें

**हवादार करना:**
• तभी जब बाहर AQI < 50 हो या अंदर से कम हो
• दोपहर 11-3 बजे सबसे अच्छा, 15-30 मिनट क्रॉस-वेंटिलेशन

**मिथक:** पौधे हवा साफ नहीं करते, नमक लैंप काम नहीं करते, एसेंशियल ऑयल VOCs बढ़ाते हैं।`
        : `**Indoor Air Protection:**

**Source Control (Essential):**
• No smoking, incense, candles, mosquito coils indoors
• Use exhaust fan when cooking

**Purifier:**
• Choose True HEPA (H13/H14), CADR ≥ 2/3 room volume
• Place in bedroom & living room, keep doors/windows closed

**Ventilation:**
• Only when outdoor AQI < 50 or indoor > outdoor
• Best: 11 AM - 3 PM, 15-30 min cross-ventilation

**Myths:** Plants don't clean air, salt lamps don't work, essential oils add VOCs.`,
      citations: ['EPA Indoor Air Quality Guidance', 'WHO Housing and Health Guidelines', 'SmogShield Indoor Advisor'],
    };
  }

  if (msg.includes('travel') || msg.includes('commute') || msg.includes('transport') || msg.includes('यात्रा') || msg.includes('सफर')) {
    return {
      response: isHindi
        ? `**कम उत्सर्जन यात्रा विकल्प:**

**सबसे अच्छा:** मेट्रो/लोकल ट्रेन (${20}-${25}g CO2/km)
**अच्छा:** बस, कारपूल (${25}-${75}g CO2/km)
**साइकिल/पैदल:** 0 उत्सर्जन (केवल AQI < 150 पर)

**कार में:** रीसर्कुलेशन मोड + केबिन फिल्टर, हर 15-20 मिनट में ताजी हवा
**बचें:** AQI > 200 पर पैदल/साइकिल, अकेले कार चलाना

आपका वर्तमान आवागमन मोड क्या है? मैं बेहतर विकल्प सुझा सकता हूं।`
        : `**Low-Emission Travel Options:**

**Best:** Metro/Local train (${20}-${25}g CO2/km)
**Good:** Bus, Carpool (${25}-${75}g CO2/km)
**Cycle/Walk:** Zero emissions (only if AQI < 150)

**In Car:** Recirculation mode + cabin filter, fresh air every 15-20 min
**Avoid:** Walk/cycle at AQI > 200, solo driving

What's your current commute mode? I can suggest better alternatives.`,
      citations: ['Indian transport emission factors (CSTEP, TERI)', 'SmogShield Emission Planner'],
    };
  }

  if (msg.includes('health') || msg.includes('symptom') || msg.includes('asthma') || msg.includes('स्वास्थ्य') || msg.includes('लक्षण') || msg.includes('दमा')) {
    return {
      response: isHindi
        ? `**स्वास्थ्य संबंधी महत्वपूर्ण जानकारी:**

⚠️ **मैं चिकित्सा सलाह नहीं दे सकता।** कृपया स्वास्थ्य संबंधी चिंताओं के लिए डॉक्टर से परामर्श करें।

**सामान्य दिशानिर्देश:**
• AQI > 150 पर: संवेदनशील समूह (बच्चे, बुजुर्ग, अस्थमा/हृदय रोगी) लक्षण अनुभव कर सकते हैं
• AQI > 200 पर: सामान्य आबादी भी प्रभावित हो सकती है
• लक्षण: खांसी, घरघराहट, सांस फूलना, सीने में जकड़न, आंखों में जलन

**तत्काल कार्रवाई:**
• N95/KN95 मास्क पहनें अगर बाहर जाना जरूरी हो
• इनडोर प्यूरीफायर चलाएं
• लक्षण बिगड़ने पर तुरंत डॉक्टर से मिलें

**आपातकाल:** सांस लेने में गंभीर कठिनाई, सीने में दर्द, भ्रम - तुरंत आपातकालीन सेवाएं कॉल करें।`
        : `**Health Information:**

⚠️ **I cannot provide medical advice.** Please consult a healthcare professional.

**General Guidelines:**
• AQI > 150: Sensitive groups (children, elderly, asthma/heart patients) may experience symptoms
• AQI > 200: General population may be affected
• Symptoms: Cough, wheeze, shortness of breath, chest tightness, eye irritation

**Immediate Actions:**
• Wear N95/KN95 if outdoor essential
• Run indoor purifier
• Seek medical attention if symptoms worsen

**Emergency:** Severe breathing difficulty, chest pain, confusion - call emergency services immediately.`,
      citations: ['WHO Air Quality Guidelines', 'CPCB Health Advisory', 'Medical disclaimer'],
    };
  }

  // Default response
  return {
    response: isHindi
      ? `मैं SmogShield AI हूँ - आपका वायु गुणवत्ता सहायक। मैं मदद कर सकता हूँ:

• **वर्तमान AQI समझाएं** - "दिल्ली का AQI क्या है?"
• **इनडोर हवा सुरक्षा** - "प्यूरीफायर कैसे चुनें?" "कब हवादार करें?"
• **यात्रा विकल्प** - "कम उत्सर्जन वाला आवागमन?"
• **दैनिक कार्य योजना** - "आज क्या करना चाहिए?"
• **स्वास्थ्य मार्गदर्शन** - सामान्य जानकारी (चिकित्सा सलाह नहीं)

क्या जानना चाहेंगे?`
      : `I'm SmogShield AI - your air quality assistant. I can help with:

• **Current AQI** - "What's Delhi's AQI?"
• **Indoor Air Protection** - "How to choose a purifier?" "When to ventilate?"
• **Travel Alternatives** - "Lower emission commute options?"
• **Daily Action Plan** - "What should I do today?"
• **Health Guidance** - General info (not medical advice)

What would you like to know?`,
    citations: ['SmogShield AI - deterministic fallback'],
  };
}

export async function generateDailyPlan(
  context: AIContext
): Promise<{ plan: string; citations: string[] }> {
  if (!context.aqi || !context.profiles) {
    return {
      plan: context.language === 'hi'
        ? 'दैनिक योजना बनाने के लिए AQI डेटा और पारिवारिक प्रोफाइल चाहिए।'
        : 'Need AQI data and family profiles to generate daily plan.',
      citations: [],
    };
  }

  const recContext: RecommendationContext = {
    aqi: context.aqi,
    profiles: context.profiles,
    plannedActivities: [],
    travelPatterns: [],
  };

  const recs = generateRecommendations(recContext);
  const indoorGuidance = getIndoorGuidance(context.profiles, context.aqi);

  const plan = context.language === 'hi'
    ? `**आज की कार्य योजना (${context.aqi.location.name} - AQI ${context.aqi.aqi})**

**सुबह (6-10 AM):**
${recs.filter(r => r.timeWindow.includes('morning') || r.timeWindow.includes('AM')).slice(0, 2).map(r => `• ${r.action}`).join('\n') || '• AQI जांचें, जरूरी हो तो N95 पहनें'}

**दोपहर (10 AM-4 PM):**
${recs.filter(r => r.timeWindow.includes('afternoon') || r.timeWindow.includes('PM')).slice(0, 2).map(r => `• ${r.action}`).join('\n') || '• प्यूरीफायर चलाएं, खिड़कियां बंद रखें'}

**शाम (4-8 PM):**
${recs.filter(r => r.timeWindow.includes('evening')).slice(0, 2).map(r => `• ${r.action}`).join('\n') || '• बाहर निकलने से बचें, इनडोर गतिविधियां करें'}

**रात (8 PM+):**
• बेडरूम में प्यूरीफायर ऑन करके सोएं
• खिड़कियां बंद रखें

**इनडोर टिप्स:**
${indoorGuidance.filter(g => g.priority === 'essential').slice(0, 2).map(g => `• ${g.title}: ${g.actionItems[0]}`).join('\n')}`

    : `**Today's Action Plan (${context.aqi.location.name} - AQI ${context.aqi.aqi})**

**Morning (6-10 AM):**
${recs.filter(r => r.timeWindow.includes('morning') || r.timeWindow.includes('AM')).slice(0, 2).map(r => `• ${r.action}`).join('\n') || '• Check AQI, wear N95 if essential travel'}

**Midday (10 AM-4 PM):**
${recs.filter(r => r.timeWindow.includes('afternoon') || r.timeWindow.includes('PM')).slice(0, 2).map(r => `• ${r.action}`).join('\n') || '• Run purifier, keep windows closed'}

**Evening (4-8 PM):**
${recs.filter(r => r.timeWindow.includes('evening')).slice(0, 2).map(r => `• ${r.action}`).join('\n') || '• Avoid outdoor, do indoor activities'}

**Night (8 PM+):**
• Sleep with purifier on in bedroom
• Keep windows closed

**Indoor Tips:**
${indoorGuidance.filter(g => g.priority === 'essential').slice(0, 2).map(g => `• ${g.title}: ${g.actionItems[0]}`).join('\n')}`;

  return {
    plan,
    citations: ['SmogShield Recommendation Engine', 'SmogShield Indoor Advisor', `${context.aqi.source} AQI data`],
  };
}