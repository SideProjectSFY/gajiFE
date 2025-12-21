<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import GlobeSvg from '@/assets/Globe.svg'

const { locale } = useI18n()
const isLanguageMenuOpen = ref(false)

const changeLanguage = (lang: 'ko' | 'en') => {
  locale.value = lang
  localStorage.setItem('locale', lang)
  isLanguageMenuOpen.value = false
}

const toggleLanguageMenu = () => {
  isLanguageMenuOpen.value = !isLanguageMenuOpen.value
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (isLanguageMenuOpen.value && !target.closest('.language-selector')) {
    isLanguageMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="language-selector" style="position: relative">
    <button
      @click.stop="toggleLanguageMenu"
      style="
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        border-radius: 0.375rem;
        color: #4b5563;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s;
      "
      onmouseover="this.style.backgroundColor='#f3f4f6'"
      onmouseout="this.style.backgroundColor='transparent'"
    >
      <GlobeSvg style="width: 1.25rem; height: 1.25rem" />
      <span style="font-size: 0.875rem; font-weight: 500">
        {{ locale === 'ko' ? '한국어' : 'English' }}
      </span>
    </button>

    <div
      v-if="isLanguageMenuOpen"
      style="
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 0.5rem;
        width: 150px;
        background-color: white;
        border-radius: 0.375rem;
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid #e5e7eb;
        z-index: 50;
        overflow: hidden;
      "
    >
      <button
        @click="changeLanguage('ko')"
        style="
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          color: #374151;
          background: transparent;
          border: none;
          cursor: pointer;
        "
        :style="{
          backgroundColor: locale === 'ko' ? '#f3f4f6' : 'transparent',
          fontWeight: locale === 'ko' ? '600' : '400',
        }"
        onmouseover="this.style.backgroundColor='#f9fafb'"
        onmouseout="this.style.backgroundColor=this.getAttribute('data-active') === 'true' ? '#f3f4f6' : 'transparent'"
        :data-active="locale === 'ko'"
      >
        한국어
      </button>
      <button
        @click="changeLanguage('en')"
        style="
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          color: #374151;
          background: transparent;
          border: none;
          cursor: pointer;
        "
        :style="{
          backgroundColor: locale === 'en' ? '#f3f4f6' : 'transparent',
          fontWeight: locale === 'en' ? '600' : '400',
        }"
        onmouseover="this.style.backgroundColor='#f9fafb'"
        onmouseout="this.style.backgroundColor=this.getAttribute('data-active') === 'true' ? '#f3f4f6' : 'transparent'"
        :data-active="locale === 'en'"
      >
        English
      </button>
    </div>
  </div>
</template>
