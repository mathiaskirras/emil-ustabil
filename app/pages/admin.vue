<script setup lang="ts">
const adminPassword = ref('')
const reportedBy = ref('')
const showExcuseDropdown = ref(false)

onMounted(() => {
  adminPassword.value = localStorage.getItem('adminPassword') || ''
  reportedBy.value = localStorage.getItem('adminName') || ''
})

const { data: activityTypes, refresh: refreshTypes } =
  await useFetch('/api/activity-types')

const { data: excuses, refresh: refreshExcuses } =
  await useFetch('/api/excuses')

const sortedActivityTypes = computed(() => {
  return [...(activityTypes.value || [])].sort((a: any, b: any) =>
    a.label.localeCompare(b.label, 'da-DK')
  )
})

const sortedExcuses = computed(() => {
  return [...(excuses.value || [])].sort((a: any, b: any) =>
    a.label.localeCompare(b.label, 'da-DK')
  )
})

const selectedExcuseLabels = computed(() => {
  return sortedExcuses.value
    .filter((excuse: any) => form.excuses.includes(excuse.value))
    .map((excuse: any) => excuse.label)
    .join(', ')
})

const form = reactive({
  title: '',
  activityType: '',
  status: 'late',
  date: '',
  delayMinutes: null,
  cancelledNoticeMinutes: null,
  excuses: [] as string[],
  severity: 3,
  note: ''
})

const newActivityType = ref('')
const newExcuse = ref('')

async function createIncident() {
  await $fetch('/api/incidents', {
    method: 'POST',
    body: {
      ...form,
      adminPassword: adminPassword.value,
      reportedBy: reportedBy.value
    }
  })

  await navigateTo('/')
}

async function createActivityType() {
  await $fetch('/api/activity-types', {
    method: 'POST',
    body: {
      label: newActivityType.value,
      adminPassword: adminPassword.value
    }
  })

  newActivityType.value = ''
  refreshTypes()
}

async function createExcuse() {
  await $fetch('/api/excuses', {
    method: 'POST',
    body: {
      label: newExcuse.value,
      adminPassword: adminPassword.value
    }
  })

  newExcuse.value = ''
  refreshExcuses()
}

const canSubmitIncident = computed(() => {
  const hasMinutes = form.status === 'late'
    ? form.delayMinutes !== null && form.delayMinutes !== ''
    : form.cancelledNoticeMinutes !== null && form.cancelledNoticeMinutes !== ''

  return Boolean(
    form.activityType &&
    form.status &&
    form.date &&
    hasMinutes &&
    form.excuses.length > 0
  )
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 px-4 py-6 text-white">
    <div class="mx-auto max-w-2xl">
      <NuxtLink to="/" class="text-sm text-purple-300">
        ← Tilbage
      </NuxtLink>

      <section class="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <h2 class="text-xl font-bold">
          Opret hændelse
        </h2>

        <div class="mt-4 space-y-4">
          <label class="field">
            <span>Titel</span>
            <input
              v-model="form.title"
              class="input"
              placeholder="Valgfri titel"
            >
          </label>

          <label class="field">
            <span>Type</span>
            <select v-model="form.activityType" class="input">
              <option value="">Vælg type</option>
              <option
                v-for="type in sortedActivityTypes"
                :key="type.value"
                :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Dato</span>
            <input
              v-model="form.date"
              type="date"
              class="input date-input"
              @click="($event.target as HTMLInputElement).showPicker?.()"
            >
          </label>

          <label class="field">
            <span>Status</span>
            <select v-model="form.status" class="input">
              <option value="late">Forsinket</option>
              <option value="cancelled">Aflyst</option>
            </select>
          </label>

          <label v-if="form.status === 'late'" class="field">
            <span>Minutter forsinket</span>
            <input
              v-model="form.delayMinutes"
              type="number"
              class="input"
              placeholder="Fx 27"
            >
          </label>

          <label v-if="form.status === 'cancelled'" class="field">
            <span>Aflysningsvarsel i minutter</span>
            <input
              v-model="form.cancelledNoticeMinutes"
              type="number"
              class="input"
              placeholder="Fx 15 eller -10 (Hvis aflyst efter tid)"
            >
          </label>

          <label class="field">
            <span>Alvorlighed: {{ form.severity }}/5</span>
            <input
              v-model="form.severity"
              type="range"
              min="1"
              max="5"
              step="1"
              class="w-full accent-purple-500"
            >
          </label>

          <div class="field relative">
            <span>Undskyldninger</span>

            <button
              type="button"
              class="input text-left"
              @click="showExcuseDropdown = !showExcuseDropdown"
            >
              <span v-if="form.excuses.length">
                {{ selectedExcuseLabels }}
              </span>
              <span v-else class="text-slate-500">
                Vælg undskyldninger
              </span>
            </button>

            <div
              v-if="showExcuseDropdown"
              class="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-white/10 bg-slate-900 p-3 shadow-2xl"
            >
              <div class="max-h-64 overflow-y-auto">
                <label
                  v-for="excuse in sortedExcuses"
                  :key="excuse.value"
                  class="flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-white/5"
                >
                  <input
                    v-model="form.excuses"
                    type="checkbox"
                    :value="excuse.value"
                    class="accent-purple-500"
                  >
            
                  {{ excuse.label }}
                </label>
              </div>
            
              <button
                type="button"
                class="mt-3 w-full rounded-xl bg-purple-500 px-4 py-2 text-sm font-bold text-white"
                @click="showExcuseDropdown = false"
              >
                Færdig
              </button>
            </div>
          </div>

          <label class="field">
            <span>Note</span>
            <textarea
              v-model="form.note"
              class="input min-h-24"
              placeholder="Valgfri note"
            />
          </label>

          <button
            class="w-full rounded-xl px-4 py-3 font-bold transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 enabled:bg-purple-500"
            :disabled="!canSubmitIncident"
            @click="createIncident"
          >
            Gem hændelse
          </button>
        </div>
      </section>

      <section class="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <h2 class="text-xl font-bold">
          Tilføj aktivitet
        </h2>

        <div class="mt-4 flex gap-2">
          <input
            v-model="newActivityType"
            class="input"
            placeholder="Fx Mandagsmad"
          >

          <button
            class="rounded-xl bg-purple-500 px-4 font-bold"
            @click="createActivityType"
          >
            +
          </button>
        </div>
      </section>

      <section class="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <h2 class="text-xl font-bold">
          Tilføj undskyldning
        </h2>

        <div class="mt-4 flex gap-2">
          <input
            v-model="newExcuse"
            class="input"
            placeholder="Fx Trafik"
          >

          <button
            class="rounded-xl bg-purple-500 px-4 font-bold"
            @click="createExcuse"
          >
            +
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field span {
  font-size: 0.875rem;
  font-weight: 700;
  color: rgb(203 213 225);
}

.input {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  background: rgb(15 23 42);
  padding: 0.75rem 1rem;
  color: white;
  outline: none;
}

.input:focus {
  border-color: rgb(192 132 252);
}

.date-input {
  color-scheme: dark;
}
</style>
