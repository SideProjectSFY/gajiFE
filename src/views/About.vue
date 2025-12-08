<script setup lang="ts">
import { css } from 'styled-system/css'
import AppHeader from '../components/common/AppHeader.vue'
import AppFooter from '../components/common/AppFooter.vue'
</script>

<template>
  <div :class="css({ minH: '100vh', display: 'flex', flexDirection: 'column', bg: 'gray.50' })">
    <AppHeader />
    <div :class="css({ h: '20' })" />

    <main
      :class="
        css({
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: { base: '4', md: '8' },
          py: '12',
        })
      "
    >
      <!-- Breadcrumb -->
      <nav
        :class="css({ maxW: '1200px', w: 'full', mb: '8' })"
        aria-label="Breadcrumb"
      >
        <ol
          :class="
            css({
              display: 'flex',
              alignItems: 'center',
              gap: '2',
              fontSize: '0.875rem',
              color: 'gray.600',
              listStyle: 'none',
              margin: 0,
              padding: 0,
            })
          "
        >
          <li>
            <router-link
              to="/"
              :class="
                css({ color: 'gray.600', textDecoration: 'none', _hover: { color: 'green.500' } })
              "
            >
              Home
            </router-link>
          </li>
          <li aria-hidden="true">
            ›
          </li>
          <li
            aria-current="page"
            :class="css({ color: 'green.600', fontWeight: '500' })"
          >
            About
          </li>
        </ol>
      </nav>

      <div :class="css({ maxW: '1200px', w: 'full' })">
        <!-- Hero Section -->
        <div :class="css({ textAlign: 'center', mb: '12' })">
          <h1
            :class="
              css({
                fontSize: { base: '2.5rem', md: '3rem' },
                fontWeight: 'bold',
                color: 'gray.900',
                mb: '4',
              })
            "
          >
            About Gaji
          </h1>

          <!-- What is Gaji Section -->
          <div
            :class="
              css({
                bg: 'green.50',
                borderRadius: '1rem',
                p: { base: '6', md: '8' },
                mb: '8',
                border: '1px solid',
                borderColor: 'green.200',
              })
            "
          >
            <h2
              :class="
                css({
                  fontSize: { base: '1.25rem', md: '1.5rem' },
                  fontWeight: 'bold',
                  color: 'green.800',
                  mb: '4',
                })
              "
            >
              What does "Gaji" mean? 🌿
            </h2>
            <p
              :class="
                css({
                  fontSize: '1rem',
                  color: 'green.900',
                  lineHeight: '1.8',
                  maxW: '700px',
                  mx: 'auto',
                })
              "
            >
              "Gaji" (가지) is the Korean word for <strong>"branch"</strong>. Just as a tree grows
              many branches, each story can branch into countless directions based on your choices
              and conversations. Our platform embodies this concept, allowing you to create unique
              narrative branches as you interact with literary characters, explore different
              scenarios, and discover new perspectives within classic stories.
            </p>
          </div>

          <p
            :class="
              css({
                fontSize: { base: '1rem', md: '1.125rem' },
                color: 'gray.600',
                lineHeight: '1.8',
                maxW: '800px',
                mx: 'auto',
              })
            "
          >
            Bridging the gap between classic literature and modern technology, Gaji brings beloved
            characters to life through AI-powered conversations.
          </p>
        </div>

        <!-- Mission Section -->
        <div :class="css({ textAlign: 'center', mb: '16' })">
          <h2
            :class="
              css({
                fontSize: { base: '1.75rem', md: '2rem' },
                fontWeight: 'bold',
                color: 'gray.900',
                mb: '4',
              })
            "
          >
            Our Mission
          </h2>
          <p
            :class="
              css({
                fontSize: '1rem',
                color: 'gray.600',
                lineHeight: '1.8',
                maxW: '700px',
                mx: 'auto',
                mb: '12',
              })
            "
          >
            To make classic literature accessible, engaging, and interactive for modern readers
            through innovative AI technology.
          </p>

          <!-- Mission Cards -->
          <div
            :class="
              css({
                display: 'grid',
                gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
                gap: '8',
                mb: '12',
              })
            "
          >
            <div
              :class="
                css({
                  bg: 'white',
                  borderRadius: '1rem',
                  p: '8',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                })
              "
            >
              <div :class="css({ fontSize: '3rem', mb: '4' })">
                📚
              </div>
              <h3
                :class="
                  css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900', mb: '3' })
                "
              >
                Preserve Literature
              </h3>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                By making classic literature appealing to be experienced by new generations in ways
                that resonate with modern audiences.
              </p>
            </div>

            <div
              :class="
                css({
                  bg: 'white',
                  borderRadius: '1rem',
                  p: '8',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                })
              "
            >
              <div :class="css({ fontSize: '3rem', mb: '4' })">
                👥
              </div>
              <h3
                :class="
                  css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900', mb: '3' })
                "
              >
                Build Community
              </h3>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                Create a space for readers through shared conversations with characters, fostering
                discussions about themes, motivations, and interpretations.
              </p>
            </div>

            <div
              :class="
                css({
                  bg: 'white',
                  borderRadius: '1rem',
                  p: '8',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                })
              "
            >
              <div :class="css({ fontSize: '3rem', mb: '4' })">
                💬
              </div>
              <h3
                :class="
                  css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900', mb: '3' })
                "
              >
                Enhance Understanding
              </h3>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                Deepen comprehension by engaging directly with characters, exploring their
                motivations, and asking questions about their worlds.
              </p>
            </div>

            <div
              :class="
                css({
                  bg: 'white',
                  borderRadius: '1rem',
                  p: '8',
                  textAlign: 'center',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                })
              "
            >
              <div :class="css({ fontSize: '3rem', mb: '4' })">
                💡
              </div>
              <h3
                :class="
                  css({ fontSize: '1.25rem', fontWeight: 'bold', color: 'gray.900', mb: '3' })
                "
              >
                Innovate Education
              </h3>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                Provide educators and students with powerful tools to explore literature in creative
                and personalized ways that fosters deeper learning.
              </p>
            </div>
          </div>
        </div>

        <!-- Get Started Section -->
        <div
          :class="css({ bg: 'white', borderRadius: '1rem', p: { base: '8', md: '12' }, mb: '12' })"
        >
          <h2
            :class="
              css({
                fontSize: { base: '1.75rem', md: '2rem' },
                fontWeight: 'bold',
                color: 'gray.900',
                textAlign: 'center',
                mb: '8',
              })
            "
          >
            Get Started in 4 Simple Steps
          </h2>

          <div :class="css({ display: 'flex', flexDirection: 'column', gap: '6' })">
            <!-- Step 1 -->
            <div :class="css({ display: 'flex', gap: '4', alignItems: 'flex-start' })">
              <div
                :class="
                  css({
                    flexShrink: 0,
                    w: '12',
                    h: '12',
                    borderRadius: 'full',
                    bg: 'green.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  })
                "
              >
                🔍
              </div>
              <div :class="css({ flex: 1 })">
                <h3
                  :class="
                    css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900', mb: '2' })
                  "
                >
                  <span :class="css({ color: 'green.600' })">STEP 1</span> Search for a Character
                </h3>
                <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                  Use our search bar to find characters from your favorite books. We have hundreds
                  of characters from classic literature ready to chat.
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div :class="css({ display: 'flex', gap: '4', alignItems: 'flex-start' })">
              <div
                :class="
                  css({
                    flexShrink: 0,
                    w: '12',
                    h: '12',
                    borderRadius: 'full',
                    bg: 'yellow.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  })
                "
              >
                💬
              </div>
              <div :class="css({ flex: 1 })">
                <h3
                  :class="
                    css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900', mb: '2' })
                  "
                >
                  <span :class="css({ color: 'green.600' })">STEP 2</span> Start a Conversation
                </h3>
                <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                  Begin chatting with the character in real-time. Ask questions, explore their
                  motivations, or discuss themes from their story.
                </p>
              </div>
            </div>

            <!-- Step 3 -->
            <div :class="css({ display: 'flex', gap: '4', alignItems: 'flex-start' })">
              <div
                :class="
                  css({
                    flexShrink: 0,
                    w: '12',
                    h: '12',
                    borderRadius: 'full',
                    bg: 'green.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  })
                "
              >
                🌳
              </div>
              <div :class="css({ flex: 1 })">
                <h3
                  :class="
                    css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900', mb: '2' })
                  "
                >
                  <span :class="css({ color: 'green.600' })">STEP 3</span> Fork and Explore
                </h3>
                <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                  Create branches in your conversation to explore different topics. Each fork
                  preserves the conversation history at that point.
                </p>
              </div>
            </div>

            <!-- Step 4 -->
            <div :class="css({ display: 'flex', gap: '4', alignItems: 'flex-start' })">
              <div
                :class="
                  css({
                    flexShrink: 0,
                    w: '12',
                    h: '12',
                    borderRadius: 'full',
                    bg: 'yellow.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                  })
                "
              >
                🔗
              </div>
              <div :class="css({ flex: 1 })">
                <h3
                  :class="
                    css({ fontSize: '1.125rem', fontWeight: 'bold', color: 'gray.900', mb: '2' })
                  "
                >
                  <span :class="css({ color: 'green.600' })">STEP 4</span> Share Your Insights
                </h3>
                <p :class="css({ fontSize: '0.875rem', color: 'gray.600', lineHeight: '1.6' })">
                  Share favorite conversations with friends, classmates, or book clubs. Export
                  conversations for essays or study materials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
