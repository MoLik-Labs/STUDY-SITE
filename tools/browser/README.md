# Trình duyệt cho kiểm thử

- `install.sh` cài Chromium headless từ npm, không cần quyền root.
- Chạy trước khi dùng: `export CHROMIUM_PATH=$(bash tools/browser/install.sh)` và `export LD_LIBRARY_PATH=$HOME/.cache/study-browser/lib:$HOME/.cache/study-browser`.
- Trên Chromium này cần `--no-sandbox --no-zygote` khi khởi chạy.
- Thư viện nằm trong `~/.cache`, không vào Git.
