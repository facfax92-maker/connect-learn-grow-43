// Nepal-localized constants for TutorConnect

export const NEPAL_SUBJECTS = [
  "Math",
  "Science",
  "English",
  "Nepali",
  "Social Studies",
  "Computer Basics",
  "SEE Preparation",
  "NEB Science (Physics, Chemistry, Biology, Math)",
  "NEB Management (Accountancy, Economics, Business Math)",
  "IOE Entrance Preparation",
  "IOM/MBBS Entrance Preparation",
  "BBA/MBA Entrance Preparation",
  "Loksewa Preparation",
  "CTEVT Courses",
  "English Speaking & Communication",
  "Coding",
  "Music",
];

export const GRADE_LEVELS = [
  { value: "grade_1_8", label: "Grade 1–8 (Primary)" },
  { value: "grade_9_10_see", label: "Grade 9–10 (SEE Preparation)" },
  { value: "grade_11_12_science", label: "Grade 11–12 Science (NEB)" },
  { value: "grade_11_12_management", label: "Grade 11–12 Management (NEB)" },
  { value: "grade_11_12_humanities", label: "Grade 11–12 Humanities (NEB)" },
  { value: "bachelors", label: "Bachelor's Level" },
  { value: "masters", label: "Master's Level" },
  { value: "entrance_exam_prep", label: "Entrance Exam Preparation" },
] as const;

export const NEPAL_CITIES = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Pokhara",
  "Biratnagar",
  "Birgunj",
  "Butwal",
  "Dharan",
  "Hetauda",
  "Nepalgunj",
  "Bharatpur",
  "Janakpur",
  "Online Only",
];

export const ENTRANCE_EXAMS = [
  "IOE",
  "IOM / MBBS",
  "BBA / MBA",
  "Loksewa",
  "None",
];

export const LANGUAGES = ["Nepali", "English", "Hindi", "Maithili", "Newari"];

export const formatNPR = (amount: number): string => {
  return `रू ${amount.toLocaleString("en-NP")}`;
};

export const PRICE_RANGE = { min: 500, max: 20000 };

export const SUPPORT_EMAIL = "facfax92@gmail.com";
export const SUPPORT_PHONE = "+977 9808031193";
