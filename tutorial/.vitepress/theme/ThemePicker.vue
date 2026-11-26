<script setup lang="ts">
// Chọn giao diện cho web hướng dẫn. Cùng khoá và cùng bảng theme với site chính (sf.theme.v1).
import { onMounted, ref } from 'vue';

// bar: trên thanh điều hướng (màn hình rộng); screen: trong menu di động.
const props = defineProps<{ variant?: 'bar' | 'screen' }>();

const KEY = 'sf.theme.v1';
const DARK = ['mocha', 'forest', 'nord', 'gruvbox'];
const OPTIONS = [
  { id: 'system', label: 'Theo máy' },
  { id: 'latte', label: 'Latte' },
  { id: 'mocha', label: 'Mocha' },
  { id: 'forest', label: 'Rừng' },
  { id: 'nord', label: 'Nord' },
  { id: 'gruvbox', label: 'Gruvbox' },
];
const choice = ref('system');
const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function resolved(id: string): string {
  if (id === 'system') return mq && mq.matches ? 'mocha' : 'latte';
  return id;
}

function apply(id: string) {
  const r = resolved(id);
  const root = document.documentElement;
  root.dataset.theme = r;
  root.classList.toggle('dark', DARK.includes(r));
}

function read(): string {
  try {
    const v = localStorage.getItem(KEY);
    return OPTIONS.some(o => o.id === v) ? (v as string) : 'system';
  } catch {
    return 'system';
  }
}

function onChange(e: Event) {
  const id = (e.target as HTMLSelectElement).value;
  choice.value = id;
  try { localStorage.setItem(KEY, id); } catch { /* không lưu được thì vẫn đổi tạm thời */ }
  apply(id);
}

onMounted(() => {
  choice.value = read();
  apply(choice.value);
  if (mq && mq.addEventListener) {
    mq.addEventListener('change', () => { if (choice.value === 'system') apply('system'); });
  }
});
</script>

<template>
  <label :class="['theme-switch', props.variant ? 'theme-switch--' + props.variant : '']">
    <span>Giao diện</span>
    <select :value="choice" aria-label="Chọn giao diện" @change="onChange">
      <option v-for="o in OPTIONS" :key="o.id" :value="o.id">{{ o.label }}</option>
    </select>
  </label>
</template>
