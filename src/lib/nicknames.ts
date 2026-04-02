/**
 * Random nickname generator + content filter for display names.
 */

const animals = [
  "海豚", "熊貓", "兔仔", "企鵝", "貓頭鷹", "小狗", "小貓",
  "獨角獸", "狐狸", "小鹿", "水獺", "小鯨",
];

const adjectives = [
  "快樂", "聰明", "勇敢", "可愛", "閃亮", "超級", "厲害",
  "開心", "醒目", "叻叻", "飛天", "神奇", "得意",
];

export function generateNickname(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${animal}#${num}`;
}

// Blocklist — common bad words in EN, ZH (Cantonese + Mandarin), and variations
// Keep adding to this list as needed
const blocklist = [
  // English
  "fuck", "shit", "ass", "dick", "bitch", "cunt", "damn", "hell",
  "cock", "pussy", "bastard", "slut", "whore", "nigga", "nigger",
  "fag", "retard", "porn", "sex", "rape", "kill", "die", "stupid",
  "idiot", "dumb", "wtf", "stfu", "lmao",
  // Cantonese
  "屌", "仆街", "痴線", "傻逼", "廢物", "白痴", "低能",
  "戇鳩", "冚家", "死", "撲街", "含家", "屎",
  "賤", "婊", "妓",
  "鳩", "𨳊", "尻", "撚", "柒", "屄", "閪",
  // Mandarin
  "操", "草泥馬", "傻逼", "他妈", "混蛋", "王八",
  "去死", "废物", "白痴", "智障", "脑残",
  "贱", "婊子",
  // Leet speak / bypass attempts
  "f*ck", "sh*t", "b1tch", "d1ck", "a55",
];

export function validateNickname(name: string): { valid: boolean; reason?: string } {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: "暱稱不能為空" };
  }

  if (trimmed.length > 12) {
    return { valid: false, reason: "暱稱最多12個字" };
  }

  if (trimmed.length < 2) {
    return { valid: false, reason: "暱稱最少2個字" };
  }

  // Only allow Chinese, English, numbers, common symbols, space
  // Check for disallowed characters by testing for anything that's NOT in the allowed set
  const disallowed = /[^\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9\s#]/;
  const hasDisallowed = trimmed.split("").some((ch) => {
    const code = ch.codePointAt(0) || 0;
    // Allow: Chinese, English, numbers, #, space, and emoji ranges
    if (!disallowed.test(ch)) return false;
    if (code >= 0x1F300 && code <= 0x1FAD6) return false; // misc symbols & pictographs
    if (code >= 0x1F600 && code <= 0x1F64F) return false; // emoticons
    if (code >= 0x1F680 && code <= 0x1F6FF) return false; // transport symbols
    if (code >= 0x2600 && code <= 0x27BF) return false;   // misc symbols
    return true;
  });
  if (hasDisallowed) {
    return { valid: false, reason: "只可以用中文、英文、數字和表情符號" };
  }

  // Check blocklist (case-insensitive, substring match)
  const lower = trimmed.toLowerCase();
  for (const word of blocklist) {
    if (lower.includes(word.toLowerCase())) {
      return { valid: false, reason: "此暱稱含有不當內容，請換一個" };
    }
  }

  return { valid: true };
}
