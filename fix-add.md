# Fix-Add: Lộ trình tái cấu trúc thực tế (phản biện mục 5 & 6 của add.md)

> Tài liệu này thay thế phần "5. Chiến lược mình đề xuất" và "6. Thứ tự bổ sung hợp lý" trong `add.md`. Phần đánh giá hiện trạng của `add.md` (mục 1-4) đã được xác minh độc lập và **chính xác** — không thay đổi. Tài liệu này chỉ điều chỉnh lại **cách thực hiện**.

---

## 1. Vấn đề với đề xuất gốc

`add.md` đề xuất:
- Giữ lại 30-40% (frontend, models, schemas, một phần api, Docker Compose, CRUD cơ bản)
- Viết lại/tái cấu trúc 60-70% thành kiến trúc bounded-context:
  ```
  platform/{identity, tenancy, billing, audit, provider-gateway, event-bus, workflow}
  brains/{knowledge-brain, marketing-brain, campaign-brain, analytics-brain}
  engines/{seo, geo, content, social, ads, email, experimentation}
  connectors/{google, meta, tiktok, linkedin, wordpress, odoo, generic-webhook}
  ```

Đây là kiến trúc **đúng** cho một SaaS trưởng thành nhiều team, nhưng con số 60-70% viết lại là quá mức cho dự án cá nhân một dev, và **thực tế đã chứng minh ngược lại**.

## 2. Bằng chứng phản biện

Hai hạng mục đầu tiên trong danh sách bounded-context của add.md đã được xây xong **mà không cần viết lại kiến trúc**:

| Bounded context (theo add.md) | Đã làm | Cách làm |
|---|---|---|
| `platform/identity` + `platform/tenancy` | ✅ Foundation Hardening | Thêm `core/deps.py`, sửa tại chỗ ~13 route file. Không đụng route/model nào ngoài phạm vi cần thiết. |
| `platform/provider-gateway` | ✅ AI Provider Gateway | Thêm package mới `services/ai_gateway/` (4 adapter: OpenAI/Anthropic/Gemini/Groq), nối vào 4 route có sẵn (Content Studio, Keyword Research, AI Assistant, SEO Audit). |

Cả hai đều hoàn thành trong monolith FastAPI hiện tại, giữ nguyên cấu trúc `backend/api/`, `backend/models/`, `backend/services/`. Không có "viết lại 60-70%" nào xảy ra để đạt được kết quả này.

## 3. Chiến lược thay thế: Strangler Fig (tái cấu trúc lũy tiến)

Nguyên tắc:
1. **Giữ FastAPI monolith làm nền càng lâu càng tốt.** Không tách microservice/package độc lập chỉ vì "kiến trúc chuẩn nói vậy".
2. **Mỗi tính năng lớn mới = 1 package mới trong `backend/services/`**, xây trong lúc cần, không tách trước khi cần (đã áp dụng đúng cho `ai_gateway/`).
3. **Chỉ tách thành service/microservice độc lập khi có tín hiệu cụ thể**: nhiều người cùng code trên cùng module, cần scale phần đó riêng, hoặc cần deploy độc lập. Không tách "phòng khi tương lai cần".
4. **Trừu tượng hóa sau khi có ví dụ thật, không trước.** Ví dụ: xây connector Google Search Console cụ thể trước, rồi mới rút ra `connector-framework` chung nếu thấy lặp lại ≥3 lần — không viết framework connector trừu tượng trước khi có connector nào.

## 4. Lộ trình cập nhật

### Đã hoàn thành

| # | Hạng mục | Ghi chú |
|---|---|---|
| 0.1 | ✅ License (Proprietary, La Chinh Tam) | Xong |
| 0.2 | ✅ Foundation Hardening | Tenant isolation (`core/deps.py`), RBAC tối thiểu (`agency_admin`/`agency_member`), SEO By AI đánh dấu `data_source: simulated` + xóa dead code, test suite (`pytest`, 8 test tenant/RBAC) |
| 0.3 | ✅ AI Provider Gateway | 4 provider (OpenAI/Anthropic/Gemini/Groq) + fallback, nối vào Content Studio, Keyword Research, AI Assistant chat, SEO Audit recommendations |

### Phase 1 — Ưu tiên tiếp theo (giá trị cao, rủi ro thấp)

Xây trong `backend/services/`, package mới mỗi mục, **không** tách microservice:

4. **Knowledge Brain** — `services/knowledge_brain/`: upload tài liệu, chunking, embedding, vector search (pgvector hoặc SQLite-vec cho local, không cần vector DB riêng ở quy mô hiện tại), API truy vấn dùng chung cho Content Studio + AI Assistant qua AI Gateway đã có sẵn.
5. **Marketing Brain** — `services/marketing_brain/`: lớp điều phối gọi các engine hiện có (SEO, Content, Ads, Social) + Knowledge Brain, dùng AI Gateway để ra quyết định/đề xuất chiến lược. Không cần event bus — gọi hàm trực tiếp trong process là đủ ở quy mô này.
6. **Campaign Generator** — nâng cấp `Campaign` CRUD hiện có: thêm brief generator, audience segmentation, budget allocation — là các hàm/route mới trong `campaigns.py` + `services/`, không phải rewrite module campaign.

### Phase 2 — Chỉ làm khi có tín hiệu cụ thể (không làm trước)

7. **Event bus / outbox** — chỉ khi có ≥2 phần thực sự cần giao tiếp bất đồng bộ (ví dụ: Marketing Brain trigger nhiều engine chạy song song và cần theo dõi trạng thái độc lập). Trước đó, gọi hàm trực tiếp là đủ.
8. **Workflow engine** — chỉ khi logic điều kiện trong code (if/else, Celery task chain) không còn đủ diễn tả quy trình. Không dùng n8n (theo yêu cầu), tự xây tối thiểu khi cần.
9. **Connector framework** — xây connector cụ thể đầu tiên (đề xuất: Google Search Console, vì liên quan trực tiếp SEO) trước, dùng nó để rút ra pattern chung, rồi mới viết `connectors/` framework nếu có ≥3 connector giống nhau.

### Phase 3 — Vận hành, làm song song không chờ các phase trên

10. **CI/CD cơ bản** — GitHub Actions: lint + test suite hiện có (`pytest`) + build check. Không cần security scan/staging approval phức tạp ở quy mô 1 dev.
11. **Observability tối thiểu** — structured logging (đã có phần nhờ sửa lỗi UnicodeEncodeError trước đó), error tracking cơ bản (Sentry free tier hoặc tương đương) trước khi có người dùng thật.
12. **Security production** — secret manager (thay `.env` placeholder), rate limiting cơ bản trên các route AI (tránh burn token), bắt buộc làm **trước khi public** app ra ngoài, không cần làm ngay bây giờ.

### Ngoài phạm vi ở quy mô hiện tại (không làm trừ khi có lý do cụ thể)

- Multi-agent framework phức tạp (planner/executor/reviewer đa tầng) — AI Gateway + gọi trực tiếp là đủ cho nhu cầu hiện tại.
- Billing/subscription — chỉ cần khi có khách hàng trả phí thật.
- Tách microservice hoàn toàn theo `platform/brains/engines/connectors/` — xem xét lại khi có ≥2 người cùng phát triển hoặc một module cần scale/deploy độc lập rõ ràng.
- GEO/AEO (Generative/Answer Engine Optimization) — làm sau khi SEO truyền thống + Knowledge Brain đã ổn định, vì phụ thuộc vào Knowledge Brain để có nội dung structured tốt.
- Attribution/experimentation platform — cần có dữ liệu traffic thật trước, chưa có giá trị khi chưa có người dùng.

## 5. Nguyên tắc áp dụng khi tái cấu trúc (checklist trước khi tách module)

Trước khi tạo `platform/`, `brains/`, `engines/`, hoặc `connectors/` như một cấu trúc top-level riêng biệt, tự hỏi:

- [ ] Có ≥2 người cùng code trên module này không?
- [ ] Module này có cần scale (CPU/RAM/traffic) khác hẳn phần còn lại không?
- [ ] Module này có cần deploy độc lập (release cycle khác) không?
- [ ] Đã có ≥2-3 ví dụ cụ thể cùng loại để rút ra abstraction chung chưa (áp dụng riêng cho `connectors/`)?

Nếu tất cả câu trả lời là "không" → giữ trong `backend/services/<tên>/` như một package Python bình thường trong monolith hiện tại.

Vài lựa chọn tiếp theo, theo đúng lộ trình fix-add.md:

Commit lại tiến độ — hiện có rất nhiều thay đổi chưa commit từ nhiều lần làm việc trước (Foundation Hardening, AI Gateway, Knowledge Brain, Marketing Brain, Campaign Generator), lần commit gần nhất chỉ là "Enterprise QA" cũ. Rủi ro mất việc nếu chưa lưu lại.
Kiểm thử Knowledge Brain + Marketing Brain end-to-end giống cách vừa làm với Campaign Generator, vì cả hai cũng đang ở dạng chưa commit và chưa xác nhận chạy được.
Chuyển sang Phase 3 (CI/CD cơ bản, observability tối thiểu) — làm song song, không phụ thuộc AI key.
Tôi khuyên nên commit trước (rủi ro thấp, giá trị cao ngay), sau đó test Knowledge Brain/Marketing Brain trong lúc chờ bạn tìm key provider khác. Bạn muốn tôi bắt đầu với commit không?