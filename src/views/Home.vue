<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { css } from 'styled-system/css'
import AppHeader from '../components/common/AppHeader.vue'
import AppFooter from '../components/common/AppFooter.vue'

const router = useRouter()

const showHotTopics = ref(false)
const searchQuery = ref('')

const hotTopics = [
  '좋아하는 작가의 새로운 단편 작품 공개',
  '#겨울과 너의 시작들 독서 챌린지',
  '작품이 선실에게 말하며 읽힌다 경험 서비스 시작',
  '실재와 어이사를 오가는 이야기들',
  '저작권도 무슨 포리스 노벨 버전',
  '가상과 현실 오가 이야기',
]

const toggleHotTopics = () => {
  showHotTopics.value = !showHotTopics.value
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value.trim() } })
  }
}
</script>

<template>
  <div :class="css({ minH: '100vh', display: 'flex', flexDirection: 'column' })">
    <AppHeader />
    <div :class="css({ h: '20' })" />

    <main
      :class="
        css({
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: '16',
        })
      "
    >
      <div :class="css({ textAlign: 'center', maxW: '800px', w: 'full', mb: '12' })">
        <h1
          :class="
            css({
              fontSize: { base: '3rem', md: '4rem' },
              fontWeight: 'bold',
              color: 'green.500',
              mb: '2',
            })
          "
        >
          Gaji
        </h1>
        <router-link
          to="/about"
          :class="
            css({
              fontSize: '1rem',
              color: 'gray.500',
              mb: '12',
              display: 'inline-block',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s',
              _hover: { color: 'green.500', textDecoration: 'underline' },
            })
          "
        >
          What is "Gaji" mean?
        </router-link>

        <div :class="css({ w: 'full', mb: '8' })">
          <div :class="css({ position: 'relative', w: 'full' })">
            <span
              :class="
                css({
                  position: 'absolute',
                  left: '6',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.25rem',
                  color: 'gray.400',
                })
              "
            >🔍</span>
            <input
              v-model="searchQuery"
              :class="
                css({
                  w: 'full',
                  p: '4',
                  pl: '14',
                  fontSize: '1rem',
                  border: '2px solid',
                  borderColor: 'gray.200',
                  borderRadius: '9999px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  _focus: {
                    borderColor: 'green.500',
                    boxShadow: '0 0 0 3px rgba(72, 187, 120, 0.1)',
                  },
                  _placeholder: { color: 'green.500' },
                })
              "
              type="text"
              placeholder="Search All of Books"
              @keyup.enter="handleSearch"
            >
          </div>
        </div>

        <div :class="css({ w: 'full' })">
          <div
            :class="
              css({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: '4',
                px: '6',
                bg: 'white',
                border: '1px solid',
                borderColor: 'gray.200',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: { bg: 'gray.50' },
              })
            "
            @click="toggleHotTopics"
          >
            <span :class="css({ fontSize: '1.125rem', fontWeight: '600', color: 'gray.800' })">Hot Topics</span>
            <span
              :class="
                css({
                  fontSize: '1rem',
                  color: 'gray.500',
                  transition: 'transform 0.2s',
                  transform: showHotTopics ? 'rotate(180deg)' : 'rotate(0deg)',
                })
              "
            >▼</span>
          </div>

          <div
            v-if="showHotTopics"
            :class="
              css({
                mt: '2',
                bg: 'white',
                borderRadius: '0.5rem',
                p: '6',
                border: '1px solid',
                borderColor: 'gray.200',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              })
            "
          >
            <div
              v-for="(topic, index) in hotTopics"
              :key="index"
              :class="
                css({
                  display: 'flex',
                  alignItems: 'baseline',
                  py: '3',
                  color: 'gray.800',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  borderBottom:
                    index < hotTopics.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                })
              "
            >
              <span
                :class="css({ color: 'green.500', fontWeight: 'bold', mr: '3', minW: '1.5rem' })"
              >{{ index + 1 }}.</span>
              <span :class="css({ flex: 1 })">{{ topic }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
