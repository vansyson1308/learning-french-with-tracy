/**
 * The privacy policy — ONE source of truth (Phase 10 §42-§43), in both UI
 * languages since P2a. The in-app Privacy screen renders the sections of
 * the current UI language; release/PRIVACY_POLICY.md is the same text
 * rendered to Markdown — English first, then Vietnamese — (a test keeps
 * the two identical) for the store listing and the hosted copy.
 *
 * Wording discipline (both languages): the APP makes no network requests
 * of its own, but the operating system's speech service may use the
 * network when no on-device target-language model is available. Nothing
 * here may claim "100 % offline" or "your voice never leaves your device"
 * — those would be false on some devices, and the boundary is stated
 * instead. The Vietnamese text is a faithful translation of the English,
 * never a looser promise.
 */

import type { UiLanguage } from "./i18n/translate";

export const PRIVACY_POLICY_VERSION = "1.2";
export const PRIVACY_POLICY_EFFECTIVE = "2026-10-15";

export type PolicySection = { title: string; paragraphs: string[] };

export const PRIVACY_POLICY_SECTIONS: readonly PolicySection[] = [
  {
    title: "In short",
    paragraphs: [
      "This app teaches beginner French. It has no account, no advertising, no analytics, and no server of its own. The app itself makes no network requests: your learning progress stays in the app's private storage on your device.",
      "The one exception to \"nothing leaves the device\" is speaking practice: the app asks your device's built-in speech recognition to turn your spoken French into text, and that operating-system service may use the network on some devices. The section on speaking practice explains exactly what that means.",
    ],
  },
  {
    title: "What stays on your device",
    paragraphs: [
      "Learning progress: which lessons you finished, points and streaks, spaced-repetition scheduling for words you have met, the results of the French checks you take, your placement result, and settings such as theme, app language and daily goal. This is stored on your device in the app's private storage — a local database for your spaced-repetition cards and review history, and a settings store for everything else — and is not sent anywhere by the app.",
      "Device backups: on iPhone, a backup of your phone (iCloud or a computer) can include the app's private storage under Apple's own backup terms; on Android the app opts out of automatic app-data backup, so your progress is copied off the phone only when you export a backup yourself. When you import a backup, and once when the app first moves your history into the local database, the app keeps a safety copy of your previous progress as a file in its own documents folder on the device.",
      "The French dictionary bundled with the app (word data, pronunciation, examples) is read-only content; using it records nothing about you.",
      "Nothing you write in writing practice is stored beyond checking your answer and showing you feedback; it is not kept in progress data.",
    ],
  },
  {
    title: "Speaking practice and the microphone",
    paragraphs: [
      "The microphone is used only after you tap the record button, and only while the recording indicator is shown. Nothing is recorded until you tap the record button.",
      "To understand what you said, the app uses your device's operating-system speech recognition (Apple's speech framework on iPhone, the Android speech recognizer on Android). The app asks for on-device recognition whenever your device supports it and has the French language pack installed. If it does not, the operating system's service may send the audio to the platform provider (Apple or Google) to be recognized, under that provider's own privacy terms. The app does not operate any speech server and never receives your audio from anyone.",
      "Before a spoken check that could use network-backed recognition, the app tells you so and lets you choose to skip it. Skipping never counts against you.",
      "What the app keeps: the recognized text is used only to check your answer and is held in memory for the current session; it is not written to your progress data or to backups. In practice mode, when your device supports it, a recording of your attempt is saved in a temporary cache folder so you can listen to yourself; it is deleted when you move on and the whole folder is swept at the end of the session. Scored checks never keep a recording.",
      "You can withdraw microphone or speech-recognition permission at any time in your device's settings. Every lesson, reading, listening and writing feature keeps working without them; only the speaking parts are then skipped.",
    ],
  },
  {
    title: "Backups you create",
    paragraphs: [
      "Export creates a backup file of your learning progress only when you tap Export, and hands it to your device's share sheet so you decide where it goes (a file app, cloud storage you already use, or another device). Import reads a backup file you pick. The app never uploads or downloads backups by itself.",
      "A backup contains the progress described above. It never contains audio, transcripts of your speech, or anything you did not do in the app.",
    ],
  },
  {
    title: "Permissions the app declares",
    paragraphs: [
      "Microphone (iPhone and Android) and speech recognition (iPhone): used only for speaking practice, as described above.",
      "Android also lists standard entries that show no prompt: INTERNET (declared by the underlying framework; the app makes no requests of its own), VIBRATE (haptic feedback), and MODIFY_AUDIO_SETTINGS (to route playback correctly). The app declares no background service and does not record or play audio in the background.",
    ],
  },
  {
    title: "Third-party code",
    paragraphs: [
      "The app is built from open-source libraries (Expo, React Native, the ts-fsrs scheduler and others, listed under Licenses & attributions). None of them is an analytics, advertising or crash-reporting service, and none receives data from this app. Your device's speech service is part of the operating system, not a library shipped with the app.",
      "The app contains a switch for an optional AI tutor. It is disabled: the app contains no AI service credentials, makes no AI requests, and no AI is ever involved in checking or scoring your work.",
    ],
  },
  {
    title: "Children",
    paragraphs: [
      "The app collects no personal data from anyone, including children. It has no accounts, no messaging, no advertising and no purchases.",
    ],
  },
  {
    title: "Your choices and deleting your data",
    paragraphs: [
      "All of your data is on your device. Deleting the app removes all of it. Backups you exported are files under your own control; delete them wherever you saved them.",
      "Because nothing is collected, there is nothing to request access to or to have deleted on our side.",
    ],
  },
  {
    title: "Changes and contact",
    paragraphs: [
      "If a future version changes any of this — for example if an optional online feature is ever added — this policy will be updated first, with a new version number and date, and the change will be described in the app.",
      "The support contact for this app is published on its store listing.",
    ],
  },
];

/** Tiếng Việt — bản dịch trung thành của chính sách tiếng Anh ở trên (cùng số mục, cùng ranh giới). */
export const PRIVACY_POLICY_SECTIONS_VI: readonly PolicySection[] = [
  {
    title: "Tóm tắt",
    paragraphs: [
      "Ứng dụng này dạy tiếng Pháp cho người mới bắt đầu. Không có tài khoản, không quảng cáo, không phân tích dữ liệu, và không có máy chủ riêng. Bản thân ứng dụng không gửi yêu cầu mạng nào: tiến độ học của bạn ở trong bộ nhớ riêng của ứng dụng trên thiết bị của bạn.",
      "Ngoại lệ duy nhất của “không có gì rời khỏi thiết bị” là luyện nói: ứng dụng nhờ tính năng nhận dạng giọng nói có sẵn của thiết bị chuyển lời nói tiếng Pháp của bạn thành văn bản, và dịch vụ của hệ điều hành đó có thể dùng mạng trên một số thiết bị. Mục về luyện nói giải thích chính xác điều này nghĩa là gì.",
    ],
  },
  {
    title: "Những gì ở lại trên thiết bị của bạn",
    paragraphs: [
      "Tiến độ học: bài học bạn đã hoàn thành, điểm và chuỗi ngày, lịch ôn tập ngắt quãng cho các từ bạn đã gặp, kết quả các bài kiểm tra tiếng Pháp bạn làm, kết quả kiểm tra đầu vào, và các cài đặt như giao diện, ngôn ngữ hiển thị và mục tiêu hằng ngày. Dữ liệu này được lưu trên thiết bị của bạn trong bộ nhớ riêng của ứng dụng — một cơ sở dữ liệu cục bộ cho thẻ ôn tập ngắt quãng và lịch sử ôn tập, và một kho cài đặt cho mọi thứ còn lại — và không được ứng dụng gửi đi đâu cả.",
      "Sao lưu thiết bị: trên iPhone, bản sao lưu điện thoại (iCloud hoặc máy tính) có thể bao gồm bộ nhớ riêng của ứng dụng theo điều khoản sao lưu của Apple; trên Android, ứng dụng không tham gia sao lưu dữ liệu ứng dụng tự động, nên tiến độ của bạn chỉ được sao chép ra khỏi điện thoại khi chính bạn xuất bản sao lưu. Khi bạn nhập một bản sao lưu, và một lần duy nhất khi ứng dụng chuyển lịch sử của bạn vào cơ sở dữ liệu cục bộ, ứng dụng giữ một bản sao an toàn của tiến độ trước đó dưới dạng tệp trong thư mục tài liệu riêng của nó trên thiết bị.",
      "Từ điển tiếng Pháp đi kèm ứng dụng (dữ liệu từ, cách phát âm, ví dụ) là nội dung chỉ đọc; việc dùng nó không ghi lại gì về bạn.",
      "Những gì bạn viết trong phần luyện viết không được lưu ngoài việc kiểm tra câu trả lời và hiển thị nhận xét; chúng không được giữ trong dữ liệu tiến độ.",
    ],
  },
  {
    title: "Luyện nói và micrô",
    paragraphs: [
      "Micrô chỉ được dùng sau khi bạn chạm nút ghi âm, và chỉ trong lúc chỉ báo ghi âm hiển thị. Không có gì được ghi cho đến khi bạn chạm nút ghi âm.",
      "Để hiểu bạn đã nói gì, ứng dụng dùng tính năng nhận dạng giọng nói của hệ điều hành trên thiết bị (khung nhận dạng giọng nói của Apple trên iPhone, bộ nhận dạng giọng nói của Android trên Android). Ứng dụng yêu cầu nhận dạng ngay trên thiết bị bất cứ khi nào thiết bị của bạn hỗ trợ và đã cài gói ngôn ngữ tiếng Pháp. Nếu không, dịch vụ của hệ điều hành có thể gửi âm thanh đến nhà cung cấp nền tảng (Apple hoặc Google) để nhận dạng, theo điều khoản quyền riêng tư của chính nhà cung cấp đó. Ứng dụng không vận hành máy chủ nhận dạng giọng nói nào và không bao giờ nhận âm thanh của bạn từ bất kỳ ai.",
      "Trước một bài kiểm tra nói có thể dùng nhận dạng qua mạng, ứng dụng sẽ báo cho bạn biết và cho bạn chọn bỏ qua. Bỏ qua không bao giờ bị tính là điểm trừ.",
      "Những gì ứng dụng giữ lại: văn bản được nhận dạng chỉ dùng để kiểm tra câu trả lời và được giữ trong bộ nhớ tạm cho phiên hiện tại; nó không được ghi vào dữ liệu tiến độ hay bản sao lưu. Ở chế độ luyện tập, khi thiết bị hỗ trợ, bản ghi âm lượt thử của bạn được lưu trong một thư mục bộ nhớ đệm tạm thời để bạn nghe lại chính mình; nó bị xóa khi bạn chuyển bước và cả thư mục được dọn sạch khi kết thúc phiên. Các bài kiểm tra có chấm điểm không bao giờ giữ bản ghi âm.",
      "Bạn có thể thu hồi quyền micrô hoặc nhận dạng giọng nói bất cứ lúc nào trong cài đặt của thiết bị. Mọi tính năng bài học, đọc, nghe và viết vẫn hoạt động mà không cần các quyền đó; chỉ các phần nói sẽ được bỏ qua.",
    ],
  },
  {
    title: "Bản sao lưu bạn tạo",
    paragraphs: [
      "Xuất tạo một tệp sao lưu tiến độ học chỉ khi bạn chạm Xuất, và chuyển tệp đó cho bảng chia sẻ của thiết bị để bạn quyết định nơi lưu (ứng dụng tệp, dịch vụ lưu trữ đám mây bạn đang dùng, hoặc một thiết bị khác). Nhập đọc tệp sao lưu bạn chọn. Ứng dụng không bao giờ tự tải lên hay tải xuống bản sao lưu.",
      "Bản sao lưu chứa tiến độ được mô tả ở trên. Nó không bao giờ chứa âm thanh, bản ghi lời nói của bạn, hay bất cứ điều gì bạn không làm trong ứng dụng.",
    ],
  },
  {
    title: "Các quyền ứng dụng khai báo",
    paragraphs: [
      "Micrô (iPhone và Android) và nhận dạng giọng nói (iPhone): chỉ dùng cho luyện nói, như mô tả ở trên.",
      "Android còn liệt kê các mục tiêu chuẩn không hiện hộp thoại: INTERNET (do nền tảng bên dưới khai báo; ứng dụng không tự gửi yêu cầu nào), VIBRATE (phản hồi rung), và MODIFY_AUDIO_SETTINGS (để định tuyến phát âm thanh đúng cách). Ứng dụng không khai báo dịch vụ chạy nền và không ghi âm hay phát âm thanh khi chạy nền.",
    ],
  },
  {
    title: "Mã của bên thứ ba",
    paragraphs: [
      "Ứng dụng được xây dựng từ các thư viện mã nguồn mở (Expo, React Native, bộ lập lịch ts-fsrs và các thư viện khác, liệt kê ở mục Giấy phép & ghi công). Không thư viện nào là dịch vụ phân tích, quảng cáo hay báo cáo sự cố, và không thư viện nào nhận dữ liệu từ ứng dụng này. Dịch vụ nhận dạng giọng nói của thiết bị là một phần của hệ điều hành, không phải thư viện đi kèm ứng dụng.",
      "Ứng dụng có một công tắc cho trợ lý AI tùy chọn. Công tắc này đang tắt: ứng dụng không chứa thông tin đăng nhập dịch vụ AI nào, không gửi yêu cầu AI nào, và không có AI nào tham gia kiểm tra hay chấm điểm bài làm của bạn.",
    ],
  },
  {
    title: "Trẻ em",
    paragraphs: [
      "Ứng dụng không thu thập dữ liệu cá nhân của bất kỳ ai, kể cả trẻ em. Không có tài khoản, không nhắn tin, không quảng cáo và không mua hàng.",
    ],
  },
  {
    title: "Lựa chọn của bạn và xóa dữ liệu",
    paragraphs: [
      "Toàn bộ dữ liệu của bạn nằm trên thiết bị của bạn. Xóa ứng dụng sẽ xóa tất cả. Các bản sao lưu bạn đã xuất là tệp do bạn tự kiểm soát; hãy xóa chúng ở nơi bạn đã lưu.",
      "Vì không có gì được thu thập, nên không có gì để yêu cầu truy cập hay yêu cầu xóa ở phía chúng tôi.",
    ],
  },
  {
    title: "Thay đổi và liên hệ",
    paragraphs: [
      "Nếu một phiên bản sau thay đổi bất kỳ điều gì ở đây — ví dụ nếu có thêm một tính năng trực tuyến tùy chọn — chính sách này sẽ được cập nhật trước, với số phiên bản và ngày mới, và thay đổi sẽ được mô tả trong ứng dụng.",
      "Thông tin liên hệ hỗ trợ của ứng dụng được công bố trên trang cửa hàng của ứng dụng.",
    ],
  },
];

const BY_LANGUAGE: Record<UiLanguage, readonly PolicySection[]> = {
  en: PRIVACY_POLICY_SECTIONS,
  vi: PRIVACY_POLICY_SECTIONS_VI,
};

export const PRIVACY_POLICY_HEADING: Record<UiLanguage, string> = {
  en: "Privacy policy",
  vi: "Chính sách quyền riêng tư",
};

/** The policy sections in a UI language. */
export function privacyPolicySections(lang: UiLanguage): readonly PolicySection[] {
  return BY_LANGUAGE[lang];
}

/** Version line in a UI language. */
export function privacyPolicyVersionLine(lang: UiLanguage): string {
  return lang === "vi"
    ? `Phiên bản ${PRIVACY_POLICY_VERSION} — hiệu lực từ ${PRIVACY_POLICY_EFFECTIVE}`
    : `Version ${PRIVACY_POLICY_VERSION} — effective ${PRIVACY_POLICY_EFFECTIVE}`;
}

function renderOne(lang: UiLanguage): string[] {
  const lines: string[] = [`# ${PRIVACY_POLICY_HEADING[lang]}`, "", privacyPolicyVersionLine(lang), ""];
  for (const section of BY_LANGUAGE[lang]) {
    lines.push(`## ${section.title}`, "");
    for (const paragraph of section.paragraphs) lines.push(paragraph, "");
  }
  return lines;
}

/** The policy as Markdown — English, then Vietnamese (release/PRIVACY_POLICY.md is exactly this). */
export function renderPrivacyPolicyMarkdown(): string {
  return [...renderOne("en"), "---", "", ...renderOne("vi")].join("\n");
}
