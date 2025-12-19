/**
 * Character Property Changes (캐릭터 속성 변경)
 * 설명: 캐릭터의 속성(성격, 소속, 능력, 배경 등)을 변경하는 방식
 * 예시: "만약 헤르미온이가 슬리데린에 배정되었다면?"
 */
export interface CharacterPropertyChange {
  /**
   * 캐릭터 이름
   */
  characterName: string

  /**
   * 집 배정 (예: 그리핀도르 → 슬리데린)
   */
  houseAssignment?: PropertyChange

  /**
   * 성격 특성 변경
   */
  personalityTraits?: PropertyChange

  /**
   * 친구 그룹 변경
   */
  friendGroup?: PropertyChange

  /**
   * 배경 스토리 변경
   */
  backgroundStory?: PropertyChange

  /**
   * 기타 속성 변경 (자유 형식)
   */
  otherChanges?: string
}

export interface PropertyChange {
  /**
   * 원래 값 (Before)
   */
  originalValue: string

  /**
   * 변경된 값 (After)
   */
  changedValue: string

  /**
   * 변경 이유 또는 설명
   */
  reason?: string
}

/**
 * Event Alterations (사건 결과 변경)
 * 설명: 스토리의 주요 사건이 다르게 진행되거나 발생하지 않는 방식
 * 예시: "만약 개츠비가 데이지를 다시 만나지 않았다면?"
 */
export interface EventAlteration {
  /**
   * 사건 이름
   */
  eventName: string

  /**
   * 원작에서의 사건 설명
   */
  originalEvent: string

  /**
   * 변경 유형
   */
  alterationType: EventAlterationType

  /**
   * 변경된 사건 결과 설명
   */
  alteredOutcome: string

  /**
   * 영향받는 타임라인 설명
   */
  timelineImpact?: string

  /**
   * 사건 발생 시점 (챕터 또는 시간)
   */
  eventTiming?: string
}

export enum EventAlterationType {
  /**
   * 사건이 발생하지 않음
   */
  NEVER_OCCURRED = 'never_occurred',

  /**
   * 사건이 막힘
   */
  PREVENTED = 'prevented',

  /**
   * 결과가 바뀜
   */
  OUTCOME_CHANGED = 'outcome_changed',

  /**
   * 사건이 성공함
   */
  SUCCEEDED = 'succeeded',
}

/**
 * Setting Modifications (배경/세계관 수정)
 * 설명: 스토리의 배경, 시대, 장소, 문화적 맥락을 변경하는 방식
 * 예시: "만약 오만과 편견이 2024년 서울에서 일어났다면?"
 */
export interface SettingModification {
  /**
   * 시간대 변경 (예: 과거 → 현재/미래)
   */
  timePeriod?: TimePeriodChange

  /**
   * 장소 변경 (예: 영국 → 한국)
   */
  location?: LocationChange

  /**
   * 문화적 맥락 변경
   */
  culturalContext?: CulturalContextChange

  /**
   * 마법 시스템/기술 수준 변경
   */
  systemChange?: SystemChange

  /**
   * 기타 세계관 변경 (자유 형식)
   */
  otherModifications?: string
}

export interface TimePeriodChange {
  /**
   * 원래 시간대
   */
  originalPeriod: string

  /**
   * 변경된 시간대
   */
  modifiedPeriod: string

  /**
   * 시간대 변경으로 인한 주요 차이점
   */
  keyDifferences?: string
}

export interface LocationChange {
  /**
   * 원래 장소
   */
  originalLocation: string

  /**
   * 변경된 장소
   */
  modifiedLocation: string

  /**
   * 장소 변경으로 인한 주요 차이점
   */
  keyDifferences?: string
}

export interface CulturalContextChange {
  /**
   * 원래 문화적 맥락
   */
  originalContext: string

  /**
   * 변경된 문화적 맥락
   */
  modifiedContext: string

  /**
   * 문화적 변경으로 인한 주요 차이점
   */
  keyDifferences?: string
}

export interface SystemChange {
  /**
   * 시스템 유형 (magic_system, technology_level, social_system 등)
   */
  systemType: string

  /**
   * 원래 시스템
   */
  originalSystem: string

  /**
   * 변경된 시스템
   */
  modifiedSystem: string

  /**
   * 시스템 변경으로 인한 주요 차이점
   */
  keyDifferences?: string
}
