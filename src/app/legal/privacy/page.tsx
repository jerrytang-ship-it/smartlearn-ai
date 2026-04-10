import LegalPageLayout from "@/components/LegalPageLayout";

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="🔒 私隱政策">
      <div className="text-sm text-[#2D2D2D] leading-relaxed space-y-4">
        <p className="text-xs text-[#A0907E]">最後更新：2026年4月10日</p>

        <section>
          <p>智學AI（「我們」）尊重並致力保護你的個人私隱。本政策說明我們如何收集、使用及保護你的資料，並符合香港《個人資料（私隱）條例》的規定。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">1. 我們收集的資料</h2>
          <p className="font-bold mt-2">匿名使用：</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>系統自動生成的匿名ID（儲存於你裝置的瀏覽器）</li>
            <li>學習進度、答題記錄、經驗值、連續學習天數</li>
            <li>裝置資訊（例如瀏覽器類型）</li>
          </ul>
          <p className="font-bold mt-3">使用Google登入：</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Google帳戶的電郵地址</li>
            <li>Google帳戶的名稱（用於顯示）</li>
            <li>Google帳戶的頭像（可選）</li>
          </ul>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">2. 資料用途</h2>
          <p>我們使用你的資料：</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>提供及改善學習體驗</li>
            <li>保存學習進度，讓你可以跨裝置使用</li>
            <li>顯示排行榜（使用暱稱，不顯示真實姓名）</li>
            <li>分析使用情況以改善課程內容</li>
            <li>發送重要通知（如政策更新）</li>
          </ul>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">3. 兒童私隱保護</h2>
          <p>我們特別重視13歲以下兒童的私隱保護：</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>我們不會主動向兒童要求過多個人資料</li>
            <li>排行榜只顯示暱稱，不顯示真實姓名</li>
            <li>我們建議家長監督兒童使用本應用</li>
            <li>家長可隨時要求刪除兒童的資料</li>
          </ul>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">4. 資料儲存及安全</h2>
          <p>你的資料儲存於 Supabase 雲端服務（符合國際安全標準）。我們採用加密技術保護資料傳輸，並限制僅授權人員可以存取。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">5. 資料分享</h2>
          <p>我們不會出售你的個人資料給第三方。我們只會在以下情況分享資料：</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>取得你（或家長）的明確同意</li>
            <li>法律要求時</li>
            <li>與服務供應商（如 Google OAuth、Supabase）分享必要資料</li>
          </ul>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">6. Cookie 及追蹤</h2>
          <p>本應用使用 localStorage 儲存你的匿名ID，用於保存學習進度。我們不使用第三方追蹤cookie。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">7. 你的權利</h2>
          <p>根據香港《個人資料（私隱）條例》，你有權：</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>查閱你的個人資料</li>
            <li>修正不正確的資料（例如暱稱）</li>
            <li>要求刪除你的帳戶及資料</li>
            <li>拒絕接收通知</li>
          </ul>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">8. 資料保留期</h2>
          <p>我們只會在必要期間保留你的資料。如你停止使用本應用超過24個月，我們可能會刪除你的帳戶資料。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">9. 政策更新</h2>
          <p>我們可能會不時更新本政策。重大變更會在應用程式內通知你。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">10. 聯絡我們</h2>
          <p>如有私隱相關問題或要求，請電郵至：<a href="mailto:privacy@smartlearn-ai.com" className="text-[#FF6B35] font-bold">privacy@smartlearn-ai.com</a></p>
        </section>
      </div>
    </LegalPageLayout>
  );
}
