export type Language = 'te' | 'en' | 'hi';

export interface Translations {
  appName: string;
  appSubtitle: string;
  verifyTitle: string;
  verifySubtitle: string;
  uploadPlaceholder: string;
  uploadHint: string;
  verifyButton: string;
  verifying: string;
  genuine: string;
  fake: string;
  confidence: string;
  extractedDetails: string;
  fraudAnalysis: string;
  aiSummary: string;
  error: string;
  changeImage: string;
  login: string;
  dashboard: string;
  history: string;
  settings: string;
  selectLanguage: string;
  continue: string;
  noFraud: string;
  readyTitle: string;
  readySubtitle: string;
  privacyTitle: string;
  privacyDesc: string;
  saveHistoryLabel: string;
  maskSensitiveData: string;
  deleteHistory: string;
  historyTitle: string;
  noHistory: string;
  deleteConfirm: string;
  loginTitle: string;
  loginSubtitle: string;
  emailLabel: string;
  passwordLabel: string;
  signIn: string;
  signOut: string;
  guestMode: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "AP/TS AI Verifier",
    appSubtitle: "Document Security System",
    verifyTitle: "Document Verification",
    verifySubtitle: "Verify Aadhaar, PAN, and Land Records in seconds. Our AI helps you detect fake documents.",
    uploadPlaceholder: "Click to upload or drag and drop",
    uploadHint: "PNG, JPG up to 10MB",
    verifyButton: "Verify Document",
    verifying: "Verifying...",
    genuine: "Genuine ✅",
    fake: "Fake ❌",
    confidence: "Confidence Score",
    extractedDetails: "Extracted Details",
    fraudAnalysis: "Fraud Analysis",
    aiSummary: "AI Summary",
    error: "Document verification failed. Please try again.",
    changeImage: "Change Image",
    login: "Login",
    dashboard: "Dashboard",
    history: "History",
    settings: "Settings",
    selectLanguage: "Select Language",
    continue: "Continue",
    noFraud: "No fraud indicators detected. Layout and fonts match official standards.",
    readyTitle: "Ready for Analysis",
    readySubtitle: "Upload a document to start the AI-powered verification process. Results will appear here.",
    privacyTitle: "Privacy & Data Usage",
    privacyDesc: "Your documents are processed in memory and deleted immediately after verification. We do not store your images. You can choose to save metadata in your local history.",
    saveHistoryLabel: "Save to History",
    maskSensitiveData: "Mask Sensitive Data",
    deleteHistory: "Clear All History",
    historyTitle: "Verification History",
    noHistory: "No history found.",
    deleteConfirm: "Are you sure you want to delete this record?",
    loginTitle: "Secure Access",
    loginSubtitle: "Sign in to access advanced forensic tools and verification history.",
    emailLabel: "Email Address",
    passwordLabel: "Password",
    signIn: "Sign In",
    signOut: "Sign Out",
    guestMode: "Continue as Guest",
  },
  te: {
    appName: "AP/TS AI వెరిఫైయర్",
    appSubtitle: "డాక్యుమెంట్ సెక్యూరిటీ సిస్టమ్",
    verifyTitle: "పత్రం ధృవీకరణ",
    verifySubtitle: "ఆధార్, పాన్ మరియు భూమి రికార్డులను సెకన్లలో ధృవీకరించండి. మా AI నకిలీ పత్రాలను గుర్తించడంలో మీకు సహాయపడుతుంది.",
    uploadPlaceholder: "అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి లేదా ఇక్కడకు లాగండి",
    uploadHint: "PNG, JPG 10MB వరకు",
    verifyButton: "ధృవీకరించండి",
    verifying: "ధృవీకరిస్తోంది...",
    genuine: "సత్యమైనది ✅",
    fake: "నకిలీ ❌",
    confidence: "విశ్వసనీయత స్కోరు",
    extractedDetails: "సేకరించిన వివరాలు",
    fraudAnalysis: "మోసం విశ్లేషణ",
    aiSummary: "AI సారాంశం",
    error: "పత్రం ధృవీకరణ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.",
    changeImage: "చిత్రాన్ని మార్చండి",
    login: "లాగిన్",
    dashboard: "డ్యాష్‌బోర్డ్",
    history: "చరిత్ర",
    settings: "సెట్టింగ్‌లు",
    selectLanguage: "భాషను ఎంచుకోండి",
    continue: "కొనసాగించండి",
    noFraud: "మోసం సూచికలు కనుగొనబడలేదు. లేఅవుట్ మరియు ఫాంట్‌లు అధికారిక ప్రమాణాలకు అనుగుణంగా ఉన్నాయి.",
    readyTitle: "విశ్లేషణకు సిద్ధంగా ఉంది",
    readySubtitle: "AI-ఆధారిత ధృవీకరణ ప్రక్రియను ప్రారంభించడానికి పత్రాన్ని అప్‌లోడ్ చేయండి. ఫలితాలు ఇక్కడ కనిపిస్తాయి.",
    privacyTitle: "గోప్యత & డేటా వినియోగం",
    privacyDesc: "మీ పత్రాలు మెమరీలో ప్రాసెస్ చేయబడతాయి మరియు ధృవీకరణ తర్వాత వెంటనే తొలగించబడతాయి. మేము మీ చిత్రాలను నిల్వ చేయము. మీరు మీ స్థానిక చరిత్రలో మెటాడేటాను సేవ్ చేయడానికి ఎంచుకోవచ్చు.",
    saveHistoryLabel: "చరిత్రలో సేవ్ చేయండి",
    maskSensitiveData: "సున్నితమైన డేటాను దాచండి",
    deleteHistory: "చరిత్రను క్లియర్ చేయండి",
    historyTitle: "ధృవీకరణ చరిత్ర",
    noHistory: "చరిత్ర ఏదీ కనుగొనబడలేదు.",
    deleteConfirm: "మీరు ఖచ్చితంగా ఈ రికార్డును తొలగించాలనుకుంటున్నారా?",
    loginTitle: "సురక్షిత ప్రాప్యత",
    loginSubtitle: "అధునాతన ఫోరెన్సిక్ సాధనాలు మరియు ధృవీకరణ చరిత్రను ప్రాప్తి చేయడానికి సైన్ ఇన్ చేయండి.",
    emailLabel: "ఈమెయిల్ చిరునామా",
    passwordLabel: "పాస్‌వర్డ్",
    signIn: "సైన్ ఇన్",
    signOut: "సైన్ అవుట్",
    guestMode: "అతిథిగా కొనసాగండి",
  },
  hi: {
    appName: "AP/TS AI सत्यापनकर्ता",
    appSubtitle: "दस्तावेज़ सुरक्षा प्रणाली",
    verifyTitle: "दस्तावेज़ सत्यापन",
    verifySubtitle: "आधार, पैन और भूमि रिकॉर्ड को सेकंडों में सत्यापित करें। हमारा AI आपको नकली दस्तावेजों का पता लगाने में मदद करता है।",
    uploadPlaceholder: "अपलोड करने के लिए क्लिक करें या खींचें",
    uploadHint: "PNG, JPG 10MB तक",
    verifyButton: "सत्यापित करें",
    verifying: "सत्यापित किया जा रहा है...",
    genuine: "असली ✅",
    fake: "नकली ❌",
    confidence: "आत्मविश्वास स्कोर",
    extractedDetails: "निकाले गए विवरण",
    fraudAnalysis: "धोखाधड़ी विश्लेषण",
    aiSummary: "AI सारांश",
    error: "दस्तावेज़ सत्यापन विफल रहा। कृपया पुनः प्रयास करें।",
    changeImage: "छवि बदलें",
    login: "लॉगिन",
    dashboard: "डैशबोर्ड",
    history: "इतिहास",
    settings: "सेटिंग्स",
    selectLanguage: "भाषा चुनें",
    continue: "जारी रखें",
    noFraud: "कोई धोखाधड़ी संकेतक नहीं मिला। लेआउट और फोंट आधिकारिक मानकों से मेल खाते हैं।",
    readyTitle: "विश्लेषण के लिए तैयार",
    readySubtitle: "AI-संचालित सत्यापन प्रक्रिया शुरू करने के लिए दस्तावेज़ अपलोड करें। परिणाम यहाँ दिखाई देंगे।",
    privacyTitle: "गोपनीयता और डेटा उपयोग",
    privacyDesc: "आपके दस्तावेज़ों को मेमोरी में संसाधित किया जाता है और सत्यापन के तुरंत बाद हटा दिया जाता है। हम आपकी छवियों को संग्रहीत नहीं करते हैं। आप अपने स्थानीय इतिहास में मेटाडेटा सहेजने का विकल्प चुन सकते हैं।",
    saveHistoryLabel: "इतिहास में सहेजें",
    maskSensitiveData: "संवेदनशील डेटा छिपाएं",
    deleteHistory: "सभी इतिहास साफ़ करें",
    historyTitle: "सत्यापन इतिहास",
    noHistory: "कोई इतिहास नहीं मिला।",
    deleteConfirm: "क्या आप वाकई इस रिकॉर्ड को हटाना चाहते हैं?",
    loginTitle: "सुरक्षित पहुंच",
    loginSubtitle: "उन्नत फोरेंसिक टूल और सत्यापन इतिहास तक पहुंचने के लिए साइन इन करें।",
    emailLabel: "ईमेल पता",
    passwordLabel: "पासवर्ड",
    signIn: "साइन इन",
    signOut: "साइन आउट",
    guestMode: "अतिथि के रूप में जारी रखें",
  }
};
