import LegalPageLayout from "@/components/LegalPageLayout";

const faqs = [
  {
    q: "智學AI係咩？",
    a: "智學AI係一個專為香港9-12歲學生設計嘅AI素養學習應用程式，用遊戲化方式教小朋友認識人工智能。",
  },
  {
    q: "我需要登入先可以用嗎？",
    a: "唔需要！你可以匿名使用本應用，所有學習進度會儲存喺你嘅裝置度。如果想要跨裝置同步，你可以用Google帳戶登入。",
  },
  {
    q: "點樣賺取經驗值（XP）？",
    a: "每答對一題（第一次嘗試）就會得到 15 XP。每累積 300 XP 就會升一級！答錯、重試或複習已完成嘅課堂都唔會得到 XP。",
  },
  {
    q: "點解我答對問題都冇 XP？",
    a: "可能係以下原因：1）你重做咗已完成嘅課堂；2）你喺錯題重試階段；3）呢條題目你之前已經答對過。XP只會喺第一次完成課堂時獲得。",
  },
  {
    q: "點樣保持連續學習天數？",
    a: "每日完成至少一題就可以保持連續天數！連續學習紀錄會顯示喺你嘅個人頁面。",
  },
  {
    q: "每日挑戰係咩？",
    a: "每日挑戰係每日更新嘅特別題目，四個類別輪流出現（🌍 AI 通識、📜 AI 歷史館、🕵️ 猜猜我是誰、🔎 搵出異類）。每日完成可以增加連續天數！",
  },
  {
    q: "我答錯咗題目會點？",
    a: "答錯嘅題目會自動加到課堂最後面，你需要再答多次。只有全部題目答啱先算完成課堂。",
  },
  {
    q: "點樣改個人暱稱？",
    a: "去個人頁面，點擊暱稱旁邊嘅鉛筆圖示，輸入新嘅暱稱即可。暱稱只會喺排行榜度顯示，唔會顯示你嘅真實姓名。",
  },
  {
    q: "排行榜上會顯示我嘅真實名字嗎？",
    a: "唔會！排行榜只會顯示你嘅暱稱（例如「快樂海豚#42」），唔會顯示你嘅Google名或電郵。用Google登入後，個人頁面會顯示你嘅Google名，但暱稱需要自己喺個人頁面修改。",
  },
  {
    q: "我嘅資料安全嗎？",
    a: "我哋使用 Supabase 雲端服務儲存資料，符合國際安全標準，資料傳輸經加密處理。資料可能儲存於海外伺服器。詳情請參閱我哋嘅私隱政策。",
  },
  {
    q: "點樣刪除我嘅帳戶？",
    a: "請電郵 support@smartlearn-ai.com，我哋會喺7日內處理你嘅要求。",
  },
  {
    q: "我發現內容有錯誤點算？",
    a: "請電郵 support@smartlearn-ai.com 通知我哋，我哋會盡快修正！",
  },
];

export default function FAQPage() {
  return (
    <LegalPageLayout title="❓ 常見問題">
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="border-b border-[#E0EAF0] pb-3 last:border-0">
            <p className="font-extrabold text-sm text-[#2D2D2D] mb-1.5">
              Q{idx + 1}. {faq.q}
            </p>
            <p className="text-sm text-[#A0907E] leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </LegalPageLayout>
  );
}
