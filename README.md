# TOEIC Lab

Ứng dụng học TOEIC theo hướng modular monolith: React/SCSS, Django REST Framework, MySQL, Redis và Nginx. Schema và dữ liệu chuẩn hóa được MySQL nạp từ `mysql/init/*.sql`; media được Nginx mount read-only từ bộ dữ liệu nguồn.

## Chạy môi trường development

1. Sao chép `.env.example` thành `.env`. Với máy local, giá trị mặc định của Compose đủ để chạy; thay các secret trước khi dùng môi trường chia sẻ.
2. Từ thư mục `toeiclab`, chạy:

   ```bash
   docker compose -f docker/docker-compose.dev.yml up --build
   ```

3. Mở [http://localhost](http://localhost). Người dùng chỉ truy cập Nginx ở port 80; Nginx định tuyến `/` tới frontend nội bộ port 3000 và `/api/`, `/admin/` tới backend nội bộ port 8000.
4. Database schema và dữ liệu mẫu được MySQL tự động nạp từ `mysql/init/*.sql` khi volume MySQL được tạo lần đầu. Không cần chạy importer Python. Chi tiết thứ tự file nằm trong [mysql/README.md](mysql/README.md).

   Hiện bộ từ có **600 thẻ liên kết trong chủ đề** (một vài từ trùng nội dung được chuẩn hóa thành cùng term).

Development dùng Nginx port `80`. MySQL vẫn expose host port `3307` và Redis `6380` cho mục đích phát triển; Django và React chỉ truy cập qua network nội bộ Docker. OTP hiện in trong response khi `DJANGO_DEBUG=true` và cũng được gửi vào console email backend.

## Chạy production

Điền secret mạnh cho `DJANGO_SECRET_KEY`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` và domain trong `.env`, sau đó:

```bash
docker compose --env-file .env -f docker/docker-compose.prod.yml up --build -d
```

MySQL tự tạo schema và nạp dữ liệu từ `mysql/init/*.sql` khi volume được tạo
lần đầu. Không chạy importer Python trong container backend.

Chỉ Nginx publish cổng HTTP; MySQL và Redis ở network nội bộ. Để dùng OTP thật, cấu hình SMTP trong `.env`. Google Sign-In chỉ hiện khi có `GOOGLE_CLIENT_ID` (giá trị đó được dùng lúc build frontend và backend xác minh ID token). Nên đặt TLS ở reverse proxy/load balancer trước khi mở ứng dụng ra Internet.

Tạo tài khoản quản trị Django:

```bash
docker compose --env-file .env -f docker/docker-compose.prod.yml exec backend python manage.py createsuperuser
```

Admin ở `/admin/`; health check API ở `/api/v1/health/`.

API documentation:

- Swagger UI: `/api/docs/`
- ReDoc: `/api/redoc/`
- OpenAPI schema: `/api/schema/`

## API / kiểm thử

Các domain Django: `users`, `content`, `vocabulary`, `learning`, `assessments`, `knowledge`; nghiệp vụ ghi/chấm bài ở `services.py`. Frontend chỉ gọi API qua `src/services`.

```bash
cd backend
python manage.py check
python manage.py test
cd ../frontend
npm ci
npm run build
```

Full test dùng 120 phút, lưu câu trả lời theo attempt, tính điểm từng Part và cung cấp review sau khi nộp. Luyện Part không có đồng hồ; có thể kiểm tra đáp án ngay. Quiz từ vựng chỉ tạo câu Việt→Anh hoặc Anh→Việt; audio chỉ nằm trên thẻ từ.
