// Cấu hình web hướng dẫn (VitePress). Triển khai lên GitHub Pages tại /STUDY-SITE/.
// Sidebar lấy từ các tệp guide/NN-*.md: tiêu đề lấy từ dòng "# ..." đầu tiên.
import { defineConfig } from 'vitepress';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const guideDir = resolve(here, '../guide');

const chapters = readdirSync(guideDir)
  .filter(f => /^\d{2}-.+\.md$/.test(f))
  .sort()
  .map(f => {
    const title = readFileSync(resolve(guideDir, f), 'utf8').match(/^# (.+)$/m)?.[1] ?? f;
    return { text: title, link: `/guide/${f.replace(/\.md$/, '')}` };
  });

const REPO = 'https://github.com/MoLik-Labs/STUDY-SITE';

export default defineConfig({
  lang: 'vi-VN',
  title: 'STUDY-SITE: hướng dẫn',
  description: 'Hướng dẫn từng bước: tải dự án, upload và push lên GitHub, làm việc theo nhánh và pull request.',
  base: '/STUDY-SITE/',
  cleanUrls: true,
  // Chọn giao diện do thanh điều hướng đảm nhiệm (Latte, Mocha, Rừng, Nord, Gruvbox), không dùng nút sáng/tối mặc định.
  appearance: false,
  lastUpdated: false,
  head: [
    // Áp theme đã lưu trước khi trang vẽ, để không chớp màu. Khoá giống site chính: sf.theme.v1.
    ['script', {}, "try{var t=localStorage.getItem('sf.theme.v1')||'system';var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=t==='system'?(d?'mocha':'latte'):t;var dark=['mocha','forest','nord','gruvbox'].indexOf(r)>-1;document.documentElement.dataset.theme=r;document.documentElement.classList.toggle('dark',dark);}catch(e){}"],
    ['meta', { name: 'theme-color', content: '#eff1f5' }],
  ],
  markdown: {
    // Mã nguồn đổi theo theme: Latte khi sáng, Mocha khi tối.
    theme: { light: 'catppuccin-latte', dark: 'catppuccin-mocha' },
    lineNumbers: false,
  },
  themeConfig: {
    nav: [
      { text: 'Hướng dẫn', link: '/guide/00-gioi-thieu', activeMatch: '/guide/' },
      { text: 'GitHub', link: REPO },
    ],
    sidebar: [{ text: 'Các chương', items: chapters }],
    socialLinks: [{ icon: 'github', link: REPO }],
    outline: { level: [2, 3], label: 'Trong trang này' },
    docFooter: { prev: 'Chương trước', next: 'Chương tiếp' },
    returnToTopLabel: 'Lên đầu trang',
    sidebarMenuLabel: 'Mục lục',
    skipToContentLabel: 'Bỏ qua và đi tới nội dung',
    darkModeSwitchLabel: 'Giao diện',
    lightModeSwitchTitle: 'Chuyển sang giao diện sáng',
    darkModeSwitchTitle: 'Chuyển sang giao diện tối',
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: 'Tìm kiếm', buttonAriaLabel: 'Tìm kiếm' },
          modal: {
            displayDetails: 'Hiện chi tiết',
            resetButtonTitle: 'Xoá từ khoá',
            backButtonTitle: 'Đóng tìm kiếm',
            noResultsText: 'Không có kết quả cho',
            footer: {
              selectText: 'chọn',
              navigateText: 'di chuyển',
              closeText: 'đóng',
            },
          },
        },
      },
    },
    footer: {
      message: 'Mã nguồn và nội dung: MoLik-Labs/STUDY-SITE',
      copyright: 'Hướng dẫn nội bộ cho người tham gia dự án.',
    },
  },
});
