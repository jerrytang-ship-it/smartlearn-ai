import LegalPageLayout from "@/components/LegalPageLayout";

export default function TermsPage() {
  return (
    <LegalPageLayout title="📋 條款及細則">
      <div className="text-sm text-[#2D2D2D] leading-relaxed space-y-4">
        <p className="text-xs text-[#A0907E]">最後更新：2026年4月10日</p>

        <section>
          <h2 className="font-extrabold text-base mb-2">1. 歡迎使用智學AI</h2>
          <p>歡迎使用智學AI！本應用程式（「本應用」）由智學AI團隊營運，旨在為香港10-13歲學生提供AI素養教育。使用本應用即代表你同意本條款。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">2. 使用年齡</h2>
          <p>本應用主要針對10-13歲兒童設計。13歲以下兒童須在家長或監護人同意下使用本應用。家長或監護人應監督兒童使用本應用。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">3. 帳戶及登入</h2>
          <p>你可以匿名使用本應用，或選擇使用Google帳戶登入以保存學習進度。登入後，你需要確保帳戶資料準確並妥善保管。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">4. 用戶行為</h2>
          <p>使用本應用時，你同意：</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>不會使用冒犯性、粗俗或不當的暱稱</li>
            <li>不會嘗試破解、入侵或干擾本應用的運作</li>
            <li>不會冒充他人或提供虛假資料</li>
            <li>遵守所有適用的香港法律</li>
          </ul>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">5. 內容及知識產權</h2>
          <p>本應用內的所有課程內容、圖像、設計、商標（包括吉祥物AI-fin）均屬智學AI所有。未經書面許可，不得複製、分發或修改。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">6. 教育內容免責聲明</h2>
          <p>本應用提供的AI知識為教育用途，我們會盡力確保內容準確，但不保證所有資料完全無誤。AI領域發展迅速，部分內容可能需要更新。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">7. 服務修改及終止</h2>
          <p>我們保留隨時修改、暫停或終止本應用部分或全部功能的權利，恕不另行通知。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">8. 責任限制</h2>
          <p>在法律允許的最大範圍內，智學AI對因使用本應用而產生的任何直接或間接損失不承擔責任。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">9. 條款修改</h2>
          <p>我們可能會不時更新本條款。重大變更會透過應用程式通知你。繼續使用本應用即代表接受更新後的條款。</p>
        </section>

        <section>
          <h2 className="font-extrabold text-base mb-2">10. 聯絡我們</h2>
          <p>如有任何問題，請電郵至：<a href="mailto:support@smartlearn-ai.com" className="text-[#FF6B35] font-bold">support@smartlearn-ai.com</a></p>
        </section>
      </div>
    </LegalPageLayout>
  );
}
