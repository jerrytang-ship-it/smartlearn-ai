// Mock data for UI mockup phase — will be replaced with Supabase queries

export interface Unit {
  id: number;
  title: string;
  description: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: number;
  unitId: number;
  title: string;
  description: string;
  status: "locked" | "unlocked" | "complete";
  xpReward: number;
  questionCount: number;
}

export interface Question {
  id: number;
  chapterId: number;
  type: "mcq" | "true_false" | "match" | "roleplay" | "news";
  prompt: string;
  options?: string[];
  correctAnswer: number | boolean | number[];
  explanation: string;
}

export interface UserStats {
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  chaptersCompleted: number;
  totalChapters: number;
  accuracy: number;
  joinedDate: string;
}

export const mockUserStats: UserStats = {
  displayName: "同學仔",
  xp: 1250,
  level: 5,
  streak: 7,
  longestStreak: 14,
  chaptersCompleted: 8,
  totalChapters: 30,
  accuracy: 82,
  joinedDate: "2026-03-01",
};

export const mockUnits: Unit[] = [
  {
    id: 1,
    title: "認識AI",
    description: "AI是什麼？它如何影響我們的日常生活？",
    chapters: [
      {
        id: 1,
        unitId: 1,
        title: "什麼是人工智能？",
        description: "了解AI的基本概念",
        status: "complete",
        xpReward: 50,
        questionCount: 5,
      },
      {
        id: 2,
        unitId: 1,
        title: "AI在身邊",
        description: "發現日常生活中的AI應用",
        status: "complete",
        xpReward: 50,
        questionCount: 5,
      },
      {
        id: 3,
        unitId: 1,
        title: "AI的歷史",
        description: "從圖靈到ChatGPT",
        status: "complete",
        xpReward: 75,
        questionCount: 6,
      },
      {
        id: 4,
        unitId: 1,
        title: "AI vs 人類",
        description: "AI能做什麼？不能做什麼？",
        status: "unlocked",
        xpReward: 75,
        questionCount: 6,
      },
      {
        id: 5,
        unitId: 1,
        title: "單元測驗",
        description: "測試你對AI的認識",
        status: "locked",
        xpReward: 100,
        questionCount: 10,
      },
    ],
  },
  {
    id: 2,
    title: "AI如何學習",
    description: "探索機器學習的奧秘",
    chapters: [
      {
        id: 6,
        unitId: 2,
        title: "數據是什麼？",
        description: "認識AI的「食物」",
        status: "locked",
        xpReward: 50,
        questionCount: 5,
      },
      {
        id: 7,
        unitId: 2,
        title: "模式識別",
        description: "AI如何找到規律",
        status: "locked",
        xpReward: 50,
        questionCount: 5,
      },
      {
        id: 8,
        unitId: 2,
        title: "訓練AI模型",
        description: "教AI學新東西",
        status: "locked",
        xpReward: 75,
        questionCount: 6,
      },
      {
        id: 9,
        unitId: 2,
        title: "好數據 vs 壞數據",
        description: "為什麼數據質量很重要",
        status: "locked",
        xpReward: 75,
        questionCount: 6,
      },
      {
        id: 10,
        unitId: 2,
        title: "單元測驗",
        description: "測試你的機器學習知識",
        status: "locked",
        xpReward: 100,
        questionCount: 10,
      },
    ],
  },
  {
    id: 3,
    title: "AI與創意",
    description: "AI能畫畫、寫詩、作曲嗎？",
    chapters: [
      {
        id: 11,
        unitId: 3,
        title: "AI藝術家",
        description: "AI如何創造圖片",
        status: "locked",
        xpReward: 50,
        questionCount: 5,
      },
      {
        id: 12,
        unitId: 3,
        title: "AI作家",
        description: "AI如何生成文字",
        status: "locked",
        xpReward: 50,
        questionCount: 5,
      },
      {
        id: 13,
        unitId: 3,
        title: "AI音樂家",
        description: "AI如何創作音樂",
        status: "locked",
        xpReward: 75,
        questionCount: 6,
      },
      {
        id: 14,
        unitId: 3,
        title: "真假難辨",
        description: "Deepfake與AI生成內容",
        status: "locked",
        xpReward: 75,
        questionCount: 6,
      },
      {
        id: 15,
        unitId: 3,
        title: "單元測驗",
        description: "測試你對AI創意的了解",
        status: "locked",
        xpReward: 100,
        questionCount: 10,
      },
    ],
  },
];

export const mockQuestions: Question[] = [
  {
    id: 1,
    chapterId: 4,
    type: "mcq",
    prompt: "以下哪一項是人工智能（AI）目前做不到的事情？",
    options: [
      "識別照片中的貓和狗",
      "翻譯不同語言",
      "真正理解人類的感情",
      "推薦你可能喜歡的影片",
    ],
    correctAnswer: 2,
    explanation:
      "AI可以模擬理解情感的行為，但目前還不能真正「感受」或「理解」人類的感情。它只是根據數據模式作出反應。",
  },
  {
    id: 2,
    chapterId: 4,
    type: "true_false",
    prompt: "AI可以自己決定要學什麼東西。",
    correctAnswer: false,
    explanation:
      "AI需要人類設定目標和提供數據才能學習。它不能像人類一樣自主決定要學什麼。",
  },
  {
    id: 3,
    chapterId: 4,
    type: "mcq",
    prompt: "下面哪一個是AI比人類做得更好的任務？",
    options: [
      "創作一首感人的詩",
      "在幾秒內分析數百萬筆數據",
      "理解朋友為什麼傷心",
      "發明全新的科學理論",
    ],
    correctAnswer: 1,
    explanation:
      "AI最擅長的是快速處理大量數據。分析數百萬筆數據對AI來說只需幾秒，但人類可能需要數年。",
  },
  {
    id: 4,
    chapterId: 4,
    type: "match",
    prompt: "將AI能力與正確的描述配對：",
    options: [
      "圖像識別 → 辨認照片中的物體",
      "自然語言處理 → 理解和生成文字",
      "推薦系統 → 猜測你會喜歡什麼",
      "語音識別 → 將說話轉成文字",
    ],
    correctAnswer: [0, 1, 2, 3],
    explanation:
      "這些都是AI的不同能力範疇。每一種都有特定的用途和應用場景。",
  },
  {
    id: 5,
    chapterId: 4,
    type: "news",
    prompt:
      "【新聞】香港學校開始使用AI批改作文，有老師擔心AI無法理解學生的創意表達。你認為AI適合批改作文嗎？",
    options: [
      "完全適合，AI比老師更客觀",
      "適合檢查文法，但創意部分應由老師評分",
      "完全不適合，作文需要人類理解",
      "現在不適合，但將來可能會適合",
    ],
    correctAnswer: 1,
    explanation:
      "這個問題沒有絕對的對錯。但大多數專家認為，AI擅長檢查客觀的文法錯誤，而創意和情感表達的評價仍然需要人類老師的判斷。",
  },
  {
    id: 6,
    chapterId: 4,
    type: "roleplay",
    prompt:
      "你的朋友說：「AI很快就會取代所有老師，以後不用上學了！」你會怎樣回應？",
    options: [
      "「你說得對！AI比老師聰明多了！」",
      "「AI可以幫助學習，但老師能理解你的感受和需要，這是AI做不到的。」",
      "「AI很危險，我們應該禁止所有AI！」",
      "「我不知道，我不關心AI的事。」",
    ],
    correctAnswer: 1,
    explanation:
      "最好的回應是既承認AI的能力，又指出人類老師不可取代的價值。AI是工具，可以輔助教學，但不能完全取代人與人之間的教育關係。",
  },
];
