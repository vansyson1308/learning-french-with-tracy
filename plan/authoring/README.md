# plan/authoring — nguyên liệu để soạn nội dung khoá học (tạo đầy đủ ở P3c)

- `BLUEPRINT.md` — khuôn khoá học chuẩn (số unit/bài/bài tập theo tiếng Pháp), do P3c sinh ra từ audit.
- `STYLE-vi.md` — quy tắc văn phong tiếng Việt cho mọi chữ người học nhìn thấy (giọng "bạn", thuật ngữ ngữ pháp, mẫu câu ước tính trình độ, không chép descriptor CEFR).
- `GLOSSARY.md` — bảng thuật ngữ ngữ pháp VI ↔ EN ↔ thuật ngữ bản ngữ (grammar term glossary) dùng thống nhất.
- `briefs/<target>-vi.md` — bản tóm tắt sư phạm cho người Việt học từng ngôn ngữ (xem `briefs/_TEMPLATE.md`); P3c viết bản đầy đủ cho es/de/it/pt/ja/ko/zh/en/fr từ research trong `05`/`06`.

## Trạng thái (P3c, 2026-10-15)

- `BLUEPRINT.md`, `STYLE-vi.md`, `GLOSSARY.md` và 9 brief (`briefs/{es,de,it,pt,ja,ko,zh,en,fr}-vi.md`) đã có.
- Bộ công cụ: `bun scripts/author.ts emit|ingest <step> --target <mã> --native vi`, `lint --course <id>`, `checklist --course <id>`, `selftest --target xx`. Gói prompt mẫu cho `es/vi` (`objectives`, `units`) nằm ở `content/es/_drafts/`.
- Mỗi bước: Claude trả lời bằng `OUTPUT.jsonl`; `ingest` kiểm tra bằng validator và ghi `REPORT.md`; chỉ sửa dòng bị báo lỗi rồi chạy lại.
