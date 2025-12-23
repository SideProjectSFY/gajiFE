import { TresCanvas } from '@tresjs/core'

declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    TresCanvas: typeof TresCanvas
  }
}
