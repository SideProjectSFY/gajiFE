<script setup lang="ts">
import { ref } from 'vue'
import type {
  CharacterPropertyChange,
  PropertyChange,
  EventAlteration,
  EventAlterationType,
  SettingModification,
  TimePeriodChange,
  LocationChange,
} from '@/types/scenario'

// Props
defineProps<{
  bookTitle: string
}>()

// Emits
const emit = defineEmits<{
  (
    e: 'submit',
    data: {
      characterChanges: CharacterPropertyChange[]
      eventAlterations: EventAlteration[]
      settingModifications: SettingModification[]
    }
  ): void
  (e: 'cancel'): void
}>()

// State - Character Changes
const characterChanges = ref<CharacterPropertyChange[]>([])
const showCharacterForm = ref(false)
const currentCharacter = ref<Partial<CharacterPropertyChange>>({})

// State - Event Alterations
const eventAlterations = ref<EventAlteration[]>([])
const showEventForm = ref(false)
const currentEvent = ref<Partial<EventAlteration>>({})

// State - Setting Modifications
const settingModifications = ref<SettingModification[]>([])
const showSettingForm = ref(false)
const currentSetting = ref<Partial<SettingModification>>({})

// Character Changes Methods
const addCharacterChange = () => {
  showCharacterForm.value = true
  currentCharacter.value = {
    characterName: '',
    otherChanges: '',
  }
}

const saveCharacterChange = () => {
  if (!currentCharacter.value.characterName) return

  characterChanges.value.push(currentCharacter.value as CharacterPropertyChange)
  showCharacterForm.value = false
  currentCharacter.value = {}
}

const removeCharacterChange = (index: number) => {
  characterChanges.value.splice(index, 1)
}

// Event Alterations Methods
const addEventAlteration = () => {
  showEventForm.value = true
  currentEvent.value = {
    eventName: '',
    originalEvent: '',
    alterationType: EventAlterationType.OUTCOME_CHANGED,
    alteredOutcome: '',
  }
}

const saveEventAlteration = () => {
  if (
    !currentEvent.value.eventName ||
    !currentEvent.value.originalEvent ||
    !currentEvent.value.alteredOutcome
  )
    return

  eventAlterations.value.push(currentEvent.value as EventAlteration)
  showEventForm.value = false
  currentEvent.value = {}
}

const removeEventAlteration = (index: number) => {
  eventAlterations.value.splice(index, 1)
}

// Setting Modifications Methods
const addSettingModification = () => {
  showSettingForm.value = true
  currentSetting.value = {}
}

const saveSettingModification = () => {
  const hasData =
    currentSetting.value.timePeriod ||
    currentSetting.value.location ||
    currentSetting.value.culturalContext ||
    currentSetting.value.systemChange

  if (!hasData) return

  settingModifications.value.push(currentSetting.value as SettingModification)
  showSettingForm.value = false
  currentSetting.value = {}
}

const removeSettingModification = (index: number) => {
  settingModifications.value.splice(index, 1)
}

// Form Methods
const handleSubmit = () => {
  emit('submit', {
    characterChanges: characterChanges.value,
    eventAlterations: eventAlterations.value,
    settingModifications: settingModifications.value,
  })
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="scenario-builder">
    <h2>Scenario Builder for {{ bookTitle }}</h2>
    <p class="subtitle">
      Create a structured "What If?" scenario by defining character changes, event alterations, or
      setting modifications.
    </p>

    <!-- Character Property Changes -->
    <section class="section">
      <h3>캐릭터 속성 변경 (Character Property Changes)</h3>
      <p class="description">캐릭터의 속성(성격, 소속, 능력, 배경 등)을 변경하는 방식</p>
      <p class="example">예시: "만약 헤르미온이가 슬리데린에 배정되었다면?"</p>

      <div v-if="characterChanges.length > 0" class="items-list">
        <div v-for="(change, index) in characterChanges" :key="index" class="item-card">
          <h4>{{ change.characterName }}</h4>
          <p v-if="change.houseAssignment">
            집 배정: {{ change.houseAssignment.originalValue }} →
            {{ change.houseAssignment.changedValue }}
          </p>
          <p v-if="change.personalityTraits">
            성격: {{ change.personalityTraits.originalValue }} →
            {{ change.personalityTraits.changedValue }}
          </p>
          <p v-if="change.friendGroup">
            친구 그룹: {{ change.friendGroup.originalValue }} →
            {{ change.friendGroup.changedValue }}
          </p>
          <p v-if="change.backgroundStory">
            배경: {{ change.backgroundStory.originalValue }} →
            {{ change.backgroundStory.changedValue }}
          </p>
          <p v-if="change.otherChanges">기타: {{ change.otherChanges }}</p>
          <button @click="removeCharacterChange(index)" class="remove-btn">Remove</button>
        </div>
      </div>

      <button v-if="!showCharacterForm" @click="addCharacterChange" class="add-btn">
        + Add Character Change
      </button>

      <div v-if="showCharacterForm" class="form-card">
        <input v-model="currentCharacter.characterName" placeholder="캐릭터 이름" class="input" />

        <div class="property-group">
          <label>집 배정</label>
          <input
            v-model="currentCharacter.houseAssignment.originalValue"
            placeholder="원래 값"
            class="input"
          />
          <input
            v-model="currentCharacter.houseAssignment.changedValue"
            placeholder="변경된 값"
            class="input"
          />
        </div>

        <div class="property-group">
          <label>성격 특성</label>
          <input
            v-model="currentCharacter.personalityTraits.originalValue"
            placeholder="원래 값"
            class="input"
          />
          <input
            v-model="currentCharacter.personalityTraits.changedValue"
            placeholder="변경된 값"
            class="input"
          />
        </div>

        <div class="property-group">
          <label>친구 그룹</label>
          <input
            v-model="currentCharacter.friendGroup.originalValue"
            placeholder="원래 값"
            class="input"
          />
          <input
            v-model="currentCharacter.friendGroup.changedValue"
            placeholder="변경된 값"
            class="input"
          />
        </div>

        <div class="property-group">
          <label>배경 스토리</label>
          <textarea
            v-model="currentCharacter.backgroundStory.originalValue"
            placeholder="원래 배경"
            class="textarea"
          ></textarea>
          <textarea
            v-model="currentCharacter.backgroundStory.changedValue"
            placeholder="변경된 배경"
            class="textarea"
          ></textarea>
        </div>

        <textarea
          v-model="currentCharacter.otherChanges"
          placeholder="기타 변경 사항"
          class="textarea"
        ></textarea>

        <div class="form-actions">
          <button @click="saveCharacterChange" class="save-btn">Save</button>
          <button @click="showCharacterForm = false" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </section>

    <!-- Event Alterations -->
    <section class="section">
      <h3>사건 결과 변경 (Event Alterations)</h3>
      <p class="description">스토리의 주요 사건이 다르게 진행되거나 발생하지 않는 방식</p>
      <p class="example">예시: "만약 개츠비가 데이지를 다시 만나지 않았다면?"</p>

      <div v-if="eventAlterations.length > 0" class="items-list">
        <div v-for="(event, index) in eventAlterations" :key="index" class="item-card">
          <h4>{{ event.eventName }}</h4>
          <p><strong>원래 사건:</strong> {{ event.originalEvent }}</p>
          <p><strong>변경 유형:</strong> {{ event.alterationType }}</p>
          <p><strong>변경된 결과:</strong> {{ event.alteredOutcome }}</p>
          <button @click="removeEventAlteration(index)" class="remove-btn">Remove</button>
        </div>
      </div>

      <button v-if="!showEventForm" @click="addEventAlteration" class="add-btn">
        + Add Event Alteration
      </button>

      <div v-if="showEventForm" class="form-card">
        <input v-model="currentEvent.eventName" placeholder="사건 이름" class="input" />
        <textarea
          v-model="currentEvent.originalEvent"
          placeholder="원작에서의 사건 설명"
          class="textarea"
        ></textarea>

        <select v-model="currentEvent.alterationType" class="select">
          <option :value="EventAlterationType.NEVER_OCCURRED">사건이 발생하지 않음</option>
          <option :value="EventAlterationType.PREVENTED">사건이 막힘</option>
          <option :value="EventAlterationType.OUTCOME_CHANGED">결과가 바뀜</option>
          <option :value="EventAlterationType.SUCCEEDED">사건이 성공함</option>
        </select>

        <textarea
          v-model="currentEvent.alteredOutcome"
          placeholder="변경된 사건 결과"
          class="textarea"
        ></textarea>
        <textarea
          v-model="currentEvent.timelineImpact"
          placeholder="타임라인 영향 (선택)"
          class="textarea"
        ></textarea>
        <input
          v-model="currentEvent.eventTiming"
          placeholder="사건 발생 시점 (선택)"
          class="input"
        />

        <div class="form-actions">
          <button @click="saveEventAlteration" class="save-btn">Save</button>
          <button @click="showEventForm = false" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </section>

    <!-- Setting Modifications -->
    <section class="section">
      <h3>배경/세계관 수정 (Setting Modifications)</h3>
      <p class="description">스토리의 배경, 시대, 장소, 문화적 맥락을 변경하는 방식</p>
      <p class="example">예시: "만약 오만과 편견이 2024년 서울에서 일어났다면?"</p>

      <div v-if="settingModifications.length > 0" class="items-list">
        <div v-for="(setting, index) in settingModifications" :key="index" class="item-card">
          <div v-if="setting.timePeriod">
            <strong>시간대:</strong> {{ setting.timePeriod.originalPeriod }} →
            {{ setting.timePeriod.modifiedPeriod }}
          </div>
          <div v-if="setting.location">
            <strong>장소:</strong> {{ setting.location.originalLocation }} →
            {{ setting.location.modifiedLocation }}
          </div>
          <div v-if="setting.culturalContext">
            <strong>문화:</strong> {{ setting.culturalContext.originalContext }} →
            {{ setting.culturalContext.modifiedContext }}
          </div>
          <div v-if="setting.systemChange">
            <strong>시스템:</strong> {{ setting.systemChange.originalSystem }} →
            {{ setting.systemChange.modifiedSystem }}
          </div>
          <button @click="removeSettingModification(index)" class="remove-btn">Remove</button>
        </div>
      </div>

      <button v-if="!showSettingForm" @click="addSettingModification" class="add-btn">
        + Add Setting Modification
      </button>

      <div v-if="showSettingForm" class="form-card">
        <div class="property-group">
          <label>시간대 변경</label>
          <input
            v-model="currentSetting.timePeriod.originalPeriod"
            placeholder="원래 시간대"
            class="input"
          />
          <input
            v-model="currentSetting.timePeriod.modifiedPeriod"
            placeholder="변경된 시간대"
            class="input"
          />
          <textarea
            v-model="currentSetting.timePeriod.keyDifferences"
            placeholder="주요 차이점"
            class="textarea"
          ></textarea>
        </div>

        <div class="property-group">
          <label>장소 변경</label>
          <input
            v-model="currentSetting.location.originalLocation"
            placeholder="원래 장소"
            class="input"
          />
          <input
            v-model="currentSetting.location.modifiedLocation"
            placeholder="변경된 장소"
            class="input"
          />
          <textarea
            v-model="currentSetting.location.keyDifferences"
            placeholder="주요 차이점"
            class="textarea"
          ></textarea>
        </div>

        <div class="form-actions">
          <button @click="saveSettingModification" class="save-btn">Save</button>
          <button @click="showSettingForm = false" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </section>

    <!-- Actions -->
    <div class="main-actions">
      <button
        @click="handleSubmit"
        class="submit-btn"
        :disabled="
          characterChanges.length === 0 &&
          eventAlterations.length === 0 &&
          settingModifications.length === 0
        "
      >
        Create Scenario
      </button>
      <button @click="handleCancel" class="cancel-btn">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.scenario-builder {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  margin-bottom: 2rem;
}

.section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.section h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.description {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.25rem;
}

.example {
  font-size: 0.85rem;
  color: #888;
  font-style: italic;
  margin-bottom: 1rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.item-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.item-card h4 {
  margin-bottom: 0.5rem;
  color: #333;
}

.item-card p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.form-card {
  background: white;
  padding: 1.5rem;
  border-radius: 6px;
  border: 1px solid #ddd;
  margin-top: 1rem;
}

.property-group {
  margin-bottom: 1rem;
}

.property-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.input,
.textarea,
.select {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}

.textarea {
  min-height: 80px;
  resize: vertical;
}

.add-btn {
  background: #4caf50;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.add-btn:hover {
  background: #45a049;
}

.save-btn {
  background: #2196f3;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
}

.save-btn:hover {
  background: #0b7dda;
}

.remove-btn {
  background: #f44336;
  color: white;
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.remove-btn:hover {
  background: #da190b;
}

.cancel-btn {
  background: #999;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: #777;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.main-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.submit-btn {
  background: #673ab7;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
}

.submit-btn:hover {
  background: #5e35b1;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
