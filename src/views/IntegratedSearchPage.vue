<!-- eslint-disable @typescript-eslint/explicit-function-return-type -->
<template>
  <div :class="css({ minH: '100vh', display: 'flex', flexDirection: 'column', bg: 'gray.50' })">
    <AppHeader />
    <div :class="css({ h: '20' })" />

    <main
      :class="
        css({
          flex: 1,
          maxW: '1200px',
          w: 'full',
          mx: 'auto',
          px: { base: '4', md: '8' },
          py: '8',
        })
      "
    >
      <!-- Search Header -->
      <div :class="css({ mb: '8' })">
        <h1
          :class="
            css({
              fontSize: { base: '2rem', md: '2.5rem' },
              fontWeight: 'bold',
              color: 'gray.900',
              mb: '4',
            })
          "
        >
          🔍 Search for books, characters, conversations...
        </h1>

        <!-- Search Input -->
        <div :class="css({ position: 'relative' })">
          <label
            for="search-input"
            class="sr-only"
          >검색어 입력</label>
          <input
            id="search-input"
            v-model="searchQuery"
            type="search"
            placeholder="Search for books, characters, conversations..."
            aria-label="책, 캐릭터, 대화 검색"
            aria-describedby="search-hint"
            :aria-busy="isSearching"
            :class="
              css({
                w: 'full',
                px: '6',
                py: '4',
                fontSize: '1.125rem',
                border: '2px solid',
                borderColor: 'gray.300',
                borderRadius: '0.75rem',
                outline: 'none',
                transition: 'all 0.2s',
                _focus: {
                  borderColor: 'green.500',
                  boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
                },
              })
            "
            @input="handleSearchInput"
            @keydown.escape="clearSearch"
          >
          <span
            id="search-hint"
            :class="css({ position: 'absolute', left: '-9999px' })"
          >
            Enter 키로 검색, Escape 키로 검색어 초기화
          </span>
          <button
            v-if="searchQuery"
            :class="
              css({
                position: 'absolute',
                right: '4',
                top: '50%',
                transform: 'translateY(-50%)',
                w: '8',
                h: '8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bg: 'gray.200',
                border: 'none',
                borderRadius: 'full',
                cursor: 'pointer',
                transition: 'all 0.2s',
                _hover: { bg: 'gray.300' },
                _focusVisible: {
                  outline: '2px solid',
                  outlineColor: 'green.500',
                  outlineOffset: '2px',
                },
              })
            "
            aria-label="검색어 지우기"
            @click="clearSearch"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div :class="css({ mb: '6' })">
        <div
          role="tablist"
          aria-label="검색 결과 카테고리"
          :class="
            css({
              display: 'flex',
              gap: '2',
              borderBottom: '2px solid',
              borderColor: 'gray.200',
              overflowX: 'auto',
            })
          "
        >
          <button
            v-for="tab in tabs"
            :id="`tab-${tab.value}`"
            :key="tab.value"
            role="tab"
            :aria-selected="activeTab === tab.value"
            :aria-controls="`tabpanel-${tab.value}`"
            :tabindex="activeTab === tab.value ? 0 : -1"
            :class="
              css({
                px: '6',
                py: '3',
                bg: 'transparent',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                color: activeTab === tab.value ? 'green.600' : 'gray.600',
                cursor: 'pointer',
                borderBottom: '2px solid',
                borderColor: activeTab === tab.value ? 'green.600' : 'transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                _hover: { color: 'green.600' },
                _focusVisible: {
                  outline: '2px solid',
                  outlineColor: 'green.500',
                  outlineOffset: '2px',
                },
              })
            "
            @click="activeTab = tab.value"
            @keydown.left="navigateTabs(-1)"
            @keydown.right="navigateTabs(1)"
          >
            {{ tab.label }}
            <span
              v-if="getTabCount(tab.value) > 0"
              :class="
                css({
                  ml: '2',
                  px: '2',
                  py: '0.5',
                  bg: activeTab === tab.value ? 'green.500' : 'gray.300',
                  color: 'white',
                  fontSize: '0.75rem',
                  borderRadius: '9999px',
                })
              "
            >
              {{ getTabCount(tab.value) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Loading State (Skeleton) -->
      <div v-if="isSearching">
        <!-- Books Skeleton -->
        <div :class="css({ mb: '8' })">
          <div
            :class="
              css({
                h: '8',
                w: '32',
                bg: 'gray.200',
                borderRadius: '0.5rem',
                mb: '4',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              })
            "
          />
          <div
            :class="
              css({
                display: 'grid',
                gridTemplateColumns: { base: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' },
                gap: '4',
              })
            "
          >
            <div
              v-for="i in 3"
              :key="`book-skeleton-${i}`"
              :class="
                css({
                  bg: 'white',
                  borderRadius: '0.75rem',
                  p: '4',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                })
              "
            >
              <div
                :class="
                  css({
                    w: 'full',
                    h: '48',
                    bg: 'gray.200',
                    borderRadius: '0.5rem',
                    mb: '3',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  })
                "
              />
              <div
                :class="
                  css({
                    h: '6',
                    bg: 'gray.200',
                    borderRadius: '0.5rem',
                    mb: '2',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  })
                "
              />
              <div
                :class="
                  css({
                    h: '4',
                    w: '3/4',
                    bg: 'gray.200',
                    borderRadius: '0.5rem',
                    mb: '2',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  })
                "
              />
              <div :class="css({ display: 'flex', gap: '2' })">
                <div
                  :class="
                    css({
                      h: '6',
                      w: '16',
                      bg: 'gray.200',
                      borderRadius: '0.25rem',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    })
                  "
                />
                <div
                  :class="
                    css({
                      h: '6',
                      w: '16',
                      bg: 'gray.200',
                      borderRadius: '0.25rem',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    })
                  "
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Stories Skeleton -->
        <div :class="css({ mb: '8' })">
          <div
            :class="
              css({
                h: '8',
                w: '24',
                bg: 'gray.200',
                borderRadius: '0.5rem',
                mb: '4',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              })
            "
          />
          <div :class="css({ display: 'flex', flexDirection: 'column', gap: '3' })">
            <div
              v-for="i in 3"
              :key="`story-skeleton-${i}`"
              :class="
                css({
                  bg: 'white',
                  borderRadius: '0.75rem',
                  p: '4',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                })
              "
            >
              <div
                :class="
                  css({
                    h: '6',
                    w: '3/4',
                    bg: 'gray.200',
                    borderRadius: '0.5rem',
                    mb: '2',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  })
                "
              />
              <div
                :class="
                  css({
                    h: '4',
                    bg: 'gray.200',
                    borderRadius: '0.5rem',
                    mb: '1',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  })
                "
              />
              <div
                :class="
                  css({
                    h: '4',
                    w: '5/6',
                    bg: 'gray.200',
                    borderRadius: '0.5rem',
                    mb: '3',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  })
                "
              />
              <div :class="css({ display: 'flex', justifyContent: 'space-between' })">
                <div
                  :class="
                    css({
                      h: '4',
                      w: '24',
                      bg: 'gray.200',
                      borderRadius: '0.5rem',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    })
                  "
                />
                <div
                  :class="
                    css({
                      h: '4',
                      w: '16',
                      bg: 'gray.200',
                      borderRadius: '0.5rem',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    })
                  "
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Users Skeleton -->
        <div :class="css({ mb: '8' })">
          <div
            :class="
              css({
                h: '8',
                w: '24',
                bg: 'gray.200',
                borderRadius: '0.5rem',
                mb: '4',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              })
            "
          />
          <div
            :class="
              css({
                display: 'grid',
                gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
                gap: '3',
              })
            "
          >
            <div
              v-for="i in 4"
              :key="`user-skeleton-${i}`"
              :class="
                css({
                  bg: 'white',
                  borderRadius: '0.75rem',
                  p: '4',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3',
                })
              "
            >
              <div
                :class="
                  css({
                    w: '16',
                    h: '16',
                    bg: 'gray.200',
                    borderRadius: 'full',
                    flexShrink: 0,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  })
                "
              />
              <div :class="css({ flex: 1 })">
                <div
                  :class="
                    css({
                      h: '6',
                      w: '3/4',
                      bg: 'gray.200',
                      borderRadius: '0.5rem',
                      mb: '2',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    })
                  "
                />
                <div
                  :class="
                    css({
                      h: '4',
                      w: '1/2',
                      bg: 'gray.200',
                      borderRadius: '0.5rem',
                      mb: '2',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    })
                  "
                />
                <div :class="css({ display: 'flex', gap: '4' })">
                  <div
                    :class="
                      css({
                        h: '4',
                        w: '20',
                        bg: 'gray.200',
                        borderRadius: '0.5rem',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      })
                    "
                  />
                  <div
                    :class="
                      css({
                        h: '4',
                        w: '16',
                        bg: 'gray.200',
                        borderRadius: '0.5rem',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      })
                    "
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!searchQuery"
        :class="
          css({
            textAlign: 'center',
            py: '20',
          })
        "
      >
        <div :class="css({ fontSize: '4rem', mb: '4' })">
          🔍
        </div>
        <p :class="css({ fontSize: '1.25rem', fontWeight: '600', color: 'gray.700', mb: '2' })">
          Start searching
        </p>
        <p :class="css({ fontSize: '1rem', color: 'gray.500' })">
          Type something to search across all content
        </p>
      </div>

      <!-- No Results -->
      <div
        v-else-if="getTotalResults() === 0 && !isSearching"
        :class="
          css({
            textAlign: 'center',
            py: '20',
          })
        "
      >
        <div :class="css({ fontSize: '4rem', mb: '4' })">
          😞
        </div>
        <p :class="css({ fontSize: '1.25rem', fontWeight: '600', color: 'gray.700', mb: '2' })">
          No results found
        </p>
        <p :class="css({ fontSize: '1rem', color: 'gray.500' })">
          Try different keywords or browse our collections
        </p>
      </div>

      <!-- Results -->
      <div v-else>
        <!-- All Tab -->
        <div v-if="activeTab === 'all'">
          <!-- Books Section -->
          <div
            v-if="bookResults.length > 0"
            :class="css({ mb: '8' })"
          >
            <h2
              :class="
                css({
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: 'gray.900',
                  mb: '4',
                })
              "
            >
              Books ({{ bookResults.length }})
            </h2>
            <div
              :class="
                css({
                  display: 'grid',
                  gridTemplateColumns: { base: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' },
                  gap: '4',
                })
              "
            >
              <!-- Book Card -->
              <div
                v-for="book in bookResults.slice(0, 3)"
                :key="book.id"
                :class="
                  css({
                    bg: 'white',
                    borderRadius: '0.75rem',
                    p: '4',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    _hover: {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    },
                  })
                "
                @click="navigateToBook(book.id)"
              >
                <div
                  :class="
                    css({
                      w: 'full',
                      h: '48',
                      bg: 'gray.200',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: '3',
                    })
                  "
                >
                  <span :class="css({ fontSize: '3rem' })">📚</span>
                </div>
                <h3
                  :class="
                    css({ fontSize: '1.125rem', fontWeight: '600', color: 'gray.900', mb: '1' })
                  "
                >
                  {{ book.title }}
                </h3>
                <p :class="css({ fontSize: '0.875rem', color: 'gray.600', mb: '2' })">
                  by {{ book.author }} • {{ book.year }}
                </p>
                <div :class="css({ display: 'flex', gap: '2' })">
                  <span
                    v-for="tag in book.tags"
                    :key="tag"
                    :class="
                      css({
                        px: '2',
                        py: '1',
                        bg: 'green.100',
                        color: 'green.700',
                        fontSize: '0.75rem',
                        borderRadius: '0.25rem',
                      })
                    "
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
            <button
              v-if="bookResults.length > 3"
              :class="
                css({
                  mt: '4',
                  px: '4',
                  py: '2',
                  bg: 'white',
                  color: 'green.600',
                  border: '1px solid',
                  borderColor: 'green.600',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  _hover: { bg: 'green.50' },
                })
              "
              @click="activeTab = 'books'"
            >
              View all {{ bookResults.length }} books
            </button>
          </div>

          <!-- Stories Section -->
          <div
            v-if="storyResults.length > 0"
            :class="css({ mb: '8' })"
          >
            <h2
              :class="
                css({
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: 'gray.900',
                  mb: '4',
                })
              "
            >
              Story ({{ storyResults.length }})
            </h2>
            <div :class="css({ display: 'flex', flexDirection: 'column', gap: '3' })">
              <!-- Story Card -->
              <div
                v-for="story in storyResults.slice(0, 3)"
                :key="story.id"
                :class="
                  css({
                    bg: 'white',
                    borderRadius: '0.75rem',
                    p: '4',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    _hover: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
                  })
                "
                @click="navigateToScenario(story.id)"
              >
                <h3
                  :class="
                    css({ fontSize: '1.125rem', fontWeight: '600', color: 'gray.900', mb: '2' })
                  "
                >
                  {{ story.title }}
                </h3>
                <p
                  :class="
                    css({
                      fontSize: '0.875rem',
                      color: 'gray.600',
                      mb: '3',
                      lineHeight: '1.5',
                    })
                  "
                >
                  {{ story.description }}
                </p>
                <div
                  :class="
                    css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })
                  "
                >
                  <span :class="css({ fontSize: '0.875rem', color: 'gray.500' })">by {{ story.author }}</span>
                  <span :class="css({ fontSize: '0.875rem', color: 'gray.500' })">❤️ {{ story.likes }}</span>
                </div>
              </div>
            </div>
            <button
              v-if="storyResults.length > 3"
              :class="
                css({
                  mt: '4',
                  px: '4',
                  py: '2',
                  bg: 'white',
                  color: 'green.600',
                  border: '1px solid',
                  borderColor: 'green.600',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  _hover: { bg: 'green.50' },
                })
              "
              @click="activeTab = 'story'"
            >
              View all {{ storyResults.length }} stories
            </button>
          </div>

          <!-- Users Section -->
          <div
            v-if="userResults.length > 0"
            :class="css({ mb: '8' })"
          >
            <h2
              :class="
                css({
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: 'gray.900',
                  mb: '4',
                })
              "
            >
              Users ({{ userResults.length }})
            </h2>
            <div
              :class="
                css({
                  display: 'grid',
                  gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
                  gap: '3',
                })
              "
            >
              <!-- User Card -->
              <div
                v-for="user in userResults.slice(0, 4)"
                :key="user.id"
                :class="
                  css({
                    bg: 'white',
                    borderRadius: '0.75rem',
                    p: '4',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    _hover: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3',
                  })
                "
                @click="navigateToProfile(user.username)"
              >
                <div
                  :class="
                    css({
                      w: '16',
                      h: '16',
                      bg: 'gray.200',
                      borderRadius: 'full',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      flexShrink: 0,
                    })
                  "
                >
                  👤
                </div>
                <div :class="css({ flex: 1 })">
                  <h3
                    :class="
                      css({ fontSize: '1.125rem', fontWeight: '600', color: 'gray.900', mb: '1' })
                    "
                  >
                    {{ user.displayName }}
                  </h3>
                  <p :class="css({ fontSize: '0.875rem', color: 'gray.600', mb: '2' })">
                    @{{ user.username }}
                  </p>
                  <div
                    :class="
                      css({ display: 'flex', gap: '4', fontSize: '0.875rem', color: 'gray.500' })
                    "
                  >
                    <span>{{ user.followers }} followers</span>
                    <span>{{ user.stories }} stories</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              v-if="userResults.length > 4"
              :class="
                css({
                  mt: '4',
                  px: '4',
                  py: '2',
                  bg: 'white',
                  color: 'green.600',
                  border: '1px solid',
                  borderColor: 'green.600',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  _hover: { bg: 'green.50' },
                })
              "
              @click="activeTab = 'users'"
            >
              View all {{ userResults.length }} users
            </button>
          </div>
        </div>

        <!-- Book Tab -->
        <div v-else-if="activeTab === 'books'">
          <div
            :class="
              css({
                display: 'grid',
                gridTemplateColumns: { base: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' },
                gap: '4',
              })
            "
          >
            <!-- Book Card -->
            <div
              v-for="book in bookResults"
              :key="book.id"
              :class="
                css({
                  bg: 'white',
                  borderRadius: '0.75rem',
                  p: '4',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  _hover: {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  },
                })
              "
              @click="navigateToBook(book.id)"
            >
              <div
                :class="
                  css({
                    w: 'full',
                    h: '48',
                    bg: 'gray.200',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: '3',
                  })
                "
              >
                <span :class="css({ fontSize: '3rem' })">📚</span>
              </div>
              <h3
                :class="
                  css({ fontSize: '1.125rem', fontWeight: '600', color: 'gray.900', mb: '1' })
                "
              >
                {{ book.title }}
              </h3>
              <p :class="css({ fontSize: '0.875rem', color: 'gray.600', mb: '2' })">
                by {{ book.author }} • {{ book.year }}
              </p>
              <div :class="css({ display: 'flex', gap: '2' })">
                <span
                  v-for="tag in book.tags"
                  :key="tag"
                  :class="
                    css({
                      px: '2',
                      py: '1',
                      bg: 'green.100',
                      color: 'green.700',
                      fontSize: '0.75rem',
                      borderRadius: '0.25rem',
                    })
                  "
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Story Tab -->
        <div v-else-if="activeTab === 'story'">
          <div :class="css({ display: 'flex', flexDirection: 'column', gap: '3' })">
            <!-- Story Card -->
            <div
              v-for="story in storyResults"
              :key="story.id"
              :class="
                css({
                  bg: 'white',
                  borderRadius: '0.75rem',
                  p: '4',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  _hover: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
                })
              "
              @click="navigateToScenario(story.id)"
            >
              <h3
                :class="
                  css({ fontSize: '1.125rem', fontWeight: '600', color: 'gray.900', mb: '2' })
                "
              >
                {{ story.title }}
              </h3>
              <p
                :class="
                  css({
                    fontSize: '0.875rem',
                    color: 'gray.600',
                    mb: '3',
                    lineHeight: '1.5',
                  })
                "
              >
                {{ story.description }}
              </p>
              <div
                :class="
                  css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })
                "
              >
                <span :class="css({ fontSize: '0.875rem', color: 'gray.500' })">by {{ story.author }}</span>
                <span :class="css({ fontSize: '0.875rem', color: 'gray.500' })">❤️ {{ story.likes }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Users Tab -->
        <div v-else-if="activeTab === 'users'">
          <div
            :class="
              css({
                display: 'grid',
                gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
                gap: '3',
              })
            "
          >
            <!-- User Card -->
            <div
              v-for="user in userResults"
              :key="user.id"
              :class="
                css({
                  bg: 'white',
                  borderRadius: '0.75rem',
                  p: '4',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  _hover: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3',
                })
              "
              @click="navigateToProfile(user.username)"
            >
              <div
                :class="
                  css({
                    w: '16',
                    h: '16',
                    bg: 'gray.200',
                    borderRadius: 'full',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    flexShrink: 0,
                  })
                "
              >
                👤
              </div>
              <div :class="css({ flex: 1 })">
                <h3
                  :class="
                    css({ fontSize: '1.125rem', fontWeight: '600', color: 'gray.900', mb: '1' })
                  "
                >
                  {{ user.displayName }}
                </h3>
                <p :class="css({ fontSize: '0.875rem', color: 'gray.600', mb: '2' })">
                  @{{ user.username }}
                </p>
                <div
                  :class="
                    css({ display: 'flex', gap: '4', fontSize: '0.875rem', color: 'gray.500' })
                  "
                >
                  <span>{{ user.followers }} followers</span>
                  <span>{{ user.stories }} stories</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { css } from 'styled-system/css'
import AppHeader from '../components/common/AppHeader.vue'
import AppFooter from '../components/common/AppFooter.vue'

const router = useRouter()

// State
const searchQuery = ref('')
const activeTab = ref('all')
const isSearching = ref(false)

interface SearchResult {
  id: string
  name: string
  [key: string]: unknown
}

// Mock results - 실제로는 API에서 가져옴
const bookResults = ref<SearchResult[]>([])
const storyResults = ref<SearchResult[]>([])
const userResults = ref<SearchResult[]>([])

// Tabs configuration
const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Book', value: 'books' },
  { label: 'Story', value: 'story' },
  { label: 'Users', value: 'users' },
]

// Debounce timer
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Methods
const handleSearchInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    performSearch()
  }, 300)
}

const performSearch = async () => {
  if (!searchQuery.value) {
    bookResults.value = []
    storyResults.value = []
    userResults.value = []
    return
  }

  isSearching.value = true

  try {
    // Mock search - 실제로는 API 호출
    await new Promise((resolve) => setTimeout(resolve, 500))

    const query = searchQuery.value.toLowerCase()

    // Mock book search
    bookResults.value = [
      {
        id: 1,
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        year: '1925',
        tags: ['Classic', 'Drama'],
      },
      {
        id: 2,
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        year: '1813',
        tags: ['Romance', 'Classic'],
      },
    ].filter(
      (book) =>
        book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query)
    )

    // Mock story search
    storyResults.value = [
      {
        id: 1,
        title: 'What if Gatsby never met Daisy?',
        description: 'Exploring an alternate timeline where Jay Gatsby pursues a different path',
        author: 'user123',
        likes: 245,
      },
      {
        id: 2,
        title: 'Elizabeth Bennet becomes a writer',
        description: 'A scenario where Elizabeth chooses independence over marriage',
        author: 'janefan',
        likes: 189,
      },
    ].filter(
      (story) =>
        story.title.toLowerCase().includes(query) || story.description.toLowerCase().includes(query)
    )

    // Mock user search
    userResults.value = [
      {
        id: 1,
        username: 'bookworm99',
        displayName: 'Literary Explorer',
        followers: 1234,
        stories: 45,
      },
      {
        id: 2,
        username: 'classicreader',
        displayName: 'Classic Literature Fan',
        followers: 892,
        stories: 32,
      },
    ].filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.displayName.toLowerCase().includes(query)
    )
  } catch (error) {
    console.error('Search failed:', error)
  } finally {
    isSearching.value = false
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  bookResults.value = []
  storyResults.value = []
  userResults.value = []
}

const getTabCount = (tab: string): number => {
  switch (tab) {
    case 'all':
      return bookResults.value.length + storyResults.value.length + userResults.value.length
    case 'books':
      return bookResults.value.length
    case 'story':
      return storyResults.value.length
    case 'users':
      return userResults.value.length
    default:
      return 0
  }
}

const getTotalResults = (): number => {
  return bookResults.value.length + storyResults.value.length + userResults.value.length
}

const navigateToBook = (id: number) => {
  router.push(`/books/${id}`)
}

const navigateToScenario = (id: number) => {
  router.push(`/scenarios/${id}`)
}

const navigateToProfile = (username: string) => {
  router.push(`/profile/${username}`)
}

// Keyboard navigation for tabs
const navigateTabs = (direction: number) => {
  const tabValues = tabs.map((t) => t.value)
  const currentIndex = tabValues.indexOf(activeTab.value)
  let newIndex = currentIndex + direction

  if (newIndex < 0) newIndex = tabValues.length - 1
  if (newIndex >= tabValues.length) newIndex = 0

  activeTab.value = tabValues[newIndex]

  // Focus the new tab
  const newTabElement = document.getElementById(`tab-${tabValues[newIndex]}`)
  if (newTabElement) newTabElement.focus()
}
</script>

<style scoped>
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
