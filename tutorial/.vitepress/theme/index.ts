// Giao diện web hướng dẫn: theme mặc định của VitePress + bảng màu riêng + bộ chọn theme trên thanh điều hướng.
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import './custom.css';
import ThemePicker from './ThemePicker.vue';

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(ThemePicker, { variant: 'bar' }),
      'nav-screen-content-after': () => h(ThemePicker, { variant: 'screen' }),
    });
  },
};
