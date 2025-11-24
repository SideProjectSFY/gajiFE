<script setup lang="ts">
/**
 * Health Check View
 *
 * Story 0.6: Inter-Service Health Check & API Contract (Pattern B)
 *
 * Returns frontend health status including:
 * - Build version
 * - Backend connectivity
 * - Environment
 */
import { ref, onMounted } from 'vue'
import { css } from 'styled-system/css'
import api from '@/services/api'

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  frontend: {
    version: string
    environment: string
    timestamp: string
  }
  backend: {
    status: 'connected' | 'disconnected'
    responseTime?: string
    error?: string
  }
}

const healthStatus = ref<HealthStatus | null>(null)
const isLoading = ref(true)

const containerStyles = css({
  maxW: '2xl',
  mx: 'auto',
  p: '8',
  fontFamily: 'mono',
})

const cardStyles = css({
  bg: 'white',
  rounded: 'lg',
  shadow: 'md',
  p: '6',
  border: '1px solid',
  borderColor: 'gray.200',
})

const statusBadge = (status: string) =>
  css({
    display: 'inline-block',
    px: '3',
    py: '1',
    rounded: 'full',
    fontSize: 'sm',
    fontWeight: 'bold',
    bg: status === 'healthy' || status === 'connected' ? 'green.100' : 'red.100',
    color: status === 'healthy' || status === 'connected' ? 'green.800' : 'red.800',
  })

async function checkHealth() {
  const startTime = Date.now()

  const status: HealthStatus = {
    status: 'healthy',
    frontend: {
      version: import.meta.env.VITE_APP_VERSION || '0.1.0',
      environment: import.meta.env.MODE || 'development',
      timestamp: new Date().toISOString(),
    },
    backend: {
      status: 'disconnected',
    },
  }

  try {
    await api.get('/actuator/health')
    const responseTime = Date.now() - startTime
    status.backend = {
      status: 'connected',
      responseTime: `${responseTime}ms`,
    }
  } catch (error: any) {
    status.status = 'unhealthy'
    status.backend = {
      status: 'disconnected',
      error: error.message || 'Failed to connect to backend',
    }
  }

  healthStatus.value = status
  isLoading.value = false
}

onMounted(() => {
  checkHealth()
})
</script>

<template>
  <div :class="containerStyles">
    <h1 :class="css({ fontSize: '2xl', fontWeight: 'bold', mb: '6' })">
      Frontend Health Check
    </h1>

    <div
      v-if="isLoading"
      :class="css({ textAlign: 'center', py: '8' })"
    >
      Loading...
    </div>

    <div
      v-else-if="healthStatus"
      :class="cardStyles"
    >
      <div :class="css({ mb: '4' })">
        <span :class="css({ fontWeight: 'bold', mr: '2' })">Status:</span>
        <span :class="statusBadge(healthStatus.status)">
          {{ healthStatus.status.toUpperCase() }}
        </span>
      </div>

      <hr :class="css({ my: '4', borderColor: 'gray.200' })">

      <h2 :class="css({ fontWeight: 'bold', mb: '2' })">
        Frontend
      </h2>
      <ul :class="css({ mb: '4', ml: '4' })">
        <li>Version: {{ healthStatus.frontend.version }}</li>
        <li>Environment: {{ healthStatus.frontend.environment }}</li>
        <li>Timestamp: {{ healthStatus.frontend.timestamp }}</li>
      </ul>

      <h2 :class="css({ fontWeight: 'bold', mb: '2' })">
        Backend Connectivity
      </h2>
      <ul :class="css({ ml: '4' })">
        <li>
          Status:
          <span :class="statusBadge(healthStatus.backend.status)">
            {{ healthStatus.backend.status.toUpperCase() }}
          </span>
        </li>
        <li v-if="healthStatus.backend.responseTime">
          Response Time: {{ healthStatus.backend.responseTime }}
        </li>
        <li v-if="healthStatus.backend.error">
          Error: {{ healthStatus.backend.error }}
        </li>
      </ul>
    </div>

    <div :class="css({ mt: '4', fontSize: 'sm', color: 'gray.500' })">
      <p>API Endpoint: /health</p>
      <p>Pattern B Architecture: Frontend → Spring Boot → FastAPI (internal)</p>
    </div>
  </div>
</template>
