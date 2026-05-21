<script setup lang="ts">
const { data: incidents } = await useFetch('/api/incidents')
const { data: activityTypes } = await useFetch('/api/activity-types')
const { data: excuses } = await useFetch('/api/excuses')

const isAdmin = ref(false)

onMounted(() => {
  isAdmin.value = localStorage.getItem('adminUnlocked') === 'true'
})

const activityTypeLabels = computed(() => {
  return Object.fromEntries(
    (activityTypes.value || []).map((type: any) => [
      type.value,
      type.label
    ])
  )
})

const excuseLabels = computed(() => {
  return Object.fromEntries(
    (excuses.value || []).map((excuse: any) => [
      excuse.value,
      excuse.label
    ])
  )
})

const stats = computed(() => {
  const list = incidents.value || []

  const late = list.filter((x: any) => x.status === 'late')
  const cancelled = list.filter((x: any) => x.status === 'cancelled')

  const totalDelay = late.reduce((sum: number, x: any) => {
    return sum + Number(x.delayMinutes || 0)
  }, 0)

  const avgDelay = late.length
    ? Math.round(totalDelay / late.length)
    : 0

  const worstDelay = late.length
    ? Math.max(...late.map((x: any) => Number(x.delayMinutes || 0)))
    : 0

  const avgSeverity = list.length
    ? Math.round(
      list.reduce((sum: number, x: any) => {
        return sum + Number(x.severity || 0)
      }, 0) / list.length * 10
    ) / 10
    : 0

  const reliabilityScore = Math.max(
    0,
    Math.round(
      100 -
      avgDelay -
      cancelled.length * 8 -
      avgSeverity * 4
    )
  )

  return {
    total: list.length,
    late: late.length,
    cancelled: cancelled.length,
    avgDelay,
    totalDelay,
    worstDelay,
    avgSeverity,
    reliabilityScore
  }
})

function severityClasses(severity: number) {
  if (severity <= 1) {
    return 'bg-green-500/20 text-green-300'
  }

  if (severity === 2) {
    return 'bg-lime-500/20 text-lime-300'
  }

  if (severity === 3) {
    return 'bg-yellow-500/20 text-yellow-300'
  }

  if (severity === 4) {
    return 'bg-orange-500/20 text-orange-300'
  }

  return 'bg-red-500/20 text-red-300'
}

const topExcuses = computed(() => {
  const counts: Record<string, number> = {}

  for (const incident of incidents.value || []) {
    for (const excuse of incident.excuses || []) {
      counts[excuse] = (counts[excuse] || 0) + 1
    }
  }

  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      label: excuseLabels.value[value] || value,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
})

const excuseDistribution = computed(() => {
  const counts: Record<string, number> = {}

  for (const incident of incidents.value || []) {
    for (const excuse of incident.excuses || []) {
      counts[excuse] = (counts[excuse] || 0) + 1
    }
  }

  const total = Object.values(counts).reduce((sum, count) => {
    return sum + count
  }, 0)

  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      label: excuseLabels.value[value] || value,
      count,
      percentage: total
        ? Math.round((count / total) * 100)
        : 0
    }))
    .sort((a, b) => b.count - a.count)
})

const topDelayActivityTypes = computed(() => {
  const groups: Record<string, { total: number, count: number }> = {}

  for (const incident of incidents.value || []) {
    if (incident.status !== 'late') {
      continue
    }

    const type = incident.activityType

    if (!groups[type]) {
      groups[type] = {
        total: 0,
        count: 0
      }
    }

    groups[type].total += Number(incident.delayMinutes || 0)
    groups[type].count += 1
  }

  return Object.entries(groups)
    .map(([value, group]) => ({
      value,
      label: activityTypeLabels.value[value] || value,
      avgDelay: Math.round(group.total / group.count),
      count: group.count
    }))
    .sort((a, b) => b.avgDelay - a.avgDelay)
    .slice(0, 3)
})

const topCancelledActivityTypes = computed(() => {
  const counts: Record<string, number> = {}

  for (const incident of incidents.value || []) {
    if (incident.status !== 'cancelled') {
      continue
    }

    counts[incident.activityType] = (counts[incident.activityType] || 0) + 1
  }

  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      label: activityTypeLabels.value[value] || value,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
})

function circleStyle(value: number, max: number) {
  const percentage = Math.min(
    100,
    Math.max(
      0,
      Math.round((value / max) * 100)
    )
  )

  return {
    background: `conic-gradient(rgb(168 85 247) ${percentage}%, rgb(30 41 59) 0)`
  }
}

function donutStyle(items: any[]) {
  const colors = [
    'rgb(168 85 247)',
    'rgb(139 92 246)',
    'rgb(192 132 252)',
    'rgb(216 180 254)',
    'rgb(107 33 168)'
  ]

  let current = 0

  const segments = items.map((item, index) => {
    const start = current
    const end = current + item.percentage

    current = end

    return `${colors[index % colors.length]} ${start}% ${end}%`
  })

  if (!segments.length) {
    segments.push('rgb(30 41 59) 0% 100%')
  }

  return {
    background: `conic-gradient(${segments.join(', ')})`
  }
}

function formatMinutes(minutes: number) {
  const abs = Math.abs(minutes)
  const hours = Math.floor(abs / 60)
  const mins = abs % 60

  if (hours === 0) {
    return `${minutes}m`
  }

  const prefix = minutes < 0 ? '-' : ''

  return `${prefix}${hours}t${mins}m`
}
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-white">
    <header class="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center px-4 py-4">
        <h1 class="text-xl font-black tracking-tight text-white">
          Emil Møde<span class="text-purple-400">u</span>stabil
        </h1>
      </div>
    </header>

    <section class="mx-auto max-w-5xl px-4 py-5">
      <section class="overflow-hidden rounded-[2rem] border border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950/40 p-5 shadow-2xl shadow-purple-950/30">
        <p class="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
          Live status
        </p>

        <h2 class="mt-3 text-2xl font-black tracking-tight">
          ETA: Sandsynligvis forsinket
        </h2>

        <p class="mt-2 max-w-sm text-sm text-slate-400">
          Automatisk overvågning af mødestabilitet, undskyldningsmønstre og generel Emil-risiko.
        </p>

        <div class="mt-5 grid grid-cols-3 gap-3">
          <div class="rounded-2xl bg-white/[0.05] p-3 text-center">
            <p class="text-2xl font-black">
              {{ stats.total }}
            </p>

            <p class="text-[11px] text-slate-400">
              hændelser
            </p>
          </div>

          <div class="rounded-2xl bg-white/[0.05] p-3 text-center">
            <p class="text-2xl font-black">
              {{ stats.cancelled }}
            </p>

            <p class="text-[11px] text-slate-400">
              aflyst
            </p>
          </div>

          <div class="rounded-2xl bg-white/[0.05] p-3 text-center">
            <p class="text-2xl font-black">
              {{ formatMinutes(stats.worstDelay) }}
            </p>

            <p class="text-[11px] text-slate-400">
              rekord
            </p>
          </div>
        </div>
      </section>

      <section class="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <article class="dashboard-card">
          <div
            class="circle"
            :style="circleStyle(stats.avgDelay, 90)"
          >
            <div class="circle-inner">
              <p class="text-xl font-black">
                {{ formatMinutes(stats.avgDelay) }}
              </p>
            </div>
          </div>

          <p class="mt-3 text-center text-sm font-bold">
            Gns. forsinkelse
          </p>
        </article>

        <article class="dashboard-card">
          <div
            class="circle"
            :style="circleStyle(stats.totalDelay, 600)"
          >
            <div class="circle-inner">
              <p class="text-xl font-black">
                {{ formatMinutes(stats.totalDelay) }}
              </p>
            </div>
          </div>

          <p class="mt-3 text-center text-sm font-bold">
            Tabt tid
          </p>
        </article>
      </section>

      <section class="mt-6 grid gap-4 md:grid-cols-2">
        <article class="panel">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-black">
                Undskyldningsanalyse
              </h2>

              <p class="text-xs text-slate-500">
                Top 3 mest brugte
              </p>
            </div>

            <div class="mini-donut" :style="donutStyle(excuseDistribution)">
              <div class="mini-donut-inner" />
            </div>
          </div>

          <div class="mt-5 space-y-3">
            <div
              v-for="excuse in topExcuses"
              :key="excuse.value"
              class="ranking-row"
            >
              <div>
                <p class="font-bold">
                  {{ excuse.label }}
                </p>

                <p class="text-xs text-slate-500">
                  {{ excuse.count }} gange
                </p>
              </div>

              <span class="ranking-pill">
                #{{ topExcuses.indexOf(excuse) + 1 }}
              </span>
            </div>

            <p v-if="!topExcuses.length" class="text-sm text-slate-500">
              Ingen undskyldninger registreret endnu.
            </p>
          </div>
        </article>

        <article class="panel">
          <h2 class="text-lg font-black">
            Fordeling
          </h2>

          <p class="text-xs text-slate-500">
            Undskyldninger i procent
          </p>

          <div class="mt-5 space-y-3">
            <div
              v-for="excuse in excuseDistribution.slice(0, 5)"
              :key="excuse.value"
            >
              <div class="mb-1 flex justify-between text-sm">
                <span>{{ excuse.label }}</span>
                <span class="text-slate-400">{{ excuse.percentage }}%</span>
              </div>

              <div class="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  class="h-full rounded-full bg-purple-500"
                  :style="{ width: `${excuse.percentage}%` }"
                />
              </div>
            </div>

            <p v-if="!excuseDistribution.length" class="text-sm text-slate-500">
              Ingen data endnu.
            </p>
          </div>
        </article>
      </section>

      <section class="mt-4 grid gap-4 md:grid-cols-2">
        <article class="panel">
          <h2 class="text-lg font-black">
            Mest forsinkede typer
          </h2>

          <p class="text-xs text-slate-500">
            Top 3 efter gns. forsinkelse
          </p>

          <div class="mt-5 space-y-3">
            <div
              v-for="type in topDelayActivityTypes"
              :key="type.value"
              class="ranking-row"
            >
              <div>
                <p class="font-bold">
                  {{ type.label }}
                </p>

                <p class="text-xs text-slate-500">
                  {{ type.count }} forsinkelser
                </p>
              </div>

              <span class="ranking-pill">
                {{ formatMinutes(type.avgDelay) }}
              </span>
            </div>

            <p v-if="!topDelayActivityTypes.length" class="text-sm text-slate-500">
              Ingen forsinkelser endnu.
            </p>
          </div>
        </article>

        <article class="panel">
          <h2 class="text-lg font-black">
            Mest aflyste typer
          </h2>

          <p class="text-xs text-slate-500">
            Top 3 efter antal aflysninger
          </p>

          <div class="mt-5 space-y-3">
            <div
              v-for="type in topCancelledActivityTypes"
              :key="type.value"
              class="ranking-row"
            >
              <div>
                <p class="font-bold">
                  {{ type.label }}
                </p>

                <p class="text-xs text-slate-500">
                  aktivitetstype
                </p>
              </div>

              <span class="ranking-pill">
                {{ type.count }} aflyst
              </span>
            </div>

            <p v-if="!topCancelledActivityTypes.length" class="text-sm text-slate-500">
              Ingen aflysninger endnu.
            </p>
          </div>
        </article>
      </section>

      <section class="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-black">
              Seneste hændelser
            </h2>
          </div>

          <span class="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300">
            {{ stats.total }} total
          </span>
        </div>

        <div class="mt-4 space-y-3">
          <article
            v-for="incident in incidents"
            :key="incident._id"
            class="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="font-bold">
                  {{ incident.title || 'Uden titel' }}
                </h3>
          
                <p class="mt-1 text-xs font-bold uppercase tracking-wide text-purple-300">
                  {{ activityTypeLabels[incident.activityType] || incident.activityType }}
                </p>
          
                <p class="mt-2 text-sm text-slate-400">
                  {{ new Date(incident.date).toLocaleDateString('da-DK') }}
                  ·
                  {{
                    incident.status === 'late'
                      ? `${formatMinutes(incident.delayMinutes)} forsinket`
                      : `aflyst ${formatMinutes(incident.cancelledNoticeMinutes)} før`
                  }}
                </p>
          
                <p
                  v-if="incident.reportedBy"
                  class="mt-2 text-xs text-slate-500"
                >
                  Oprettet af
                  <span class="font-bold text-slate-300">
                    {{ incident.reportedBy }}
                  </span>
                </p>
              </div>
          
              <span
                class="rounded-full px-3 py-1 text-xs font-bold"
                :class="severityClasses(incident.severity)"
              >
                {{ incident.severity }}
              </span>
            </div>
          
            <div
              v-if="incident.excuses?.length"
              class="mt-3 flex flex-wrap gap-2"
            >
              <span
                v-for="excuse in incident.excuses"
                :key="excuse"
                class="rounded-full bg-white/5 px-2 py-1 text-[11px] text-slate-300"
              >
                {{ excuseLabels[excuse] || excuse }}
              </span>
            </div>
          
            <p
              v-if="incident.note"
              class="mt-3 text-sm text-slate-300"
            >
              {{ incident.note }}
            </p>
          </article>
        </div>
      </section>
    </section>

    <NuxtLink
      v-if="isAdmin"
      to="/admin"
      class="fixed bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500 text-3xl font-light text-white shadow-2xl shadow-purple-900/60 active:scale-95"
      aria-label="Tilføj entry"
    >
      +
    </NuxtLink>
  </main>
</template>

<style scoped>
.dashboard-card {
  border-radius: 1.5rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  background: rgb(255 255 255 / 0.04);
  padding: 1rem;
}

.panel {
  border-radius: 2rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  background: rgb(255 255 255 / 0.04);
  padding: 1.25rem;
}

.circle {
  margin: 0 auto;
  display: grid;
  height: 6.5rem;
  width: 6.5rem;
  place-items: center;
  border-radius: 9999px;
}

.circle-inner {
  display: grid;
  height: 4.8rem;
  width: 4.8rem;
  place-items: center;
  border-radius: 9999px;
  background: rgb(2 6 23);
  text-align: center;
}

.mini-donut {
  display: grid;
  height: 4rem;
  width: 4rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 9999px;
}

.mini-donut-inner {
  height: 2.7rem;
  width: 2.7rem;
  border-radius: 9999px;
  background: rgb(2 6 23);
}

.ranking-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 1rem;
  background: rgb(15 23 42 / 0.75);
  padding: 0.875rem;
}

.ranking-pill {
  flex-shrink: 0;
  border-radius: 9999px;
  background: rgb(168 85 247 / 0.2);
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: rgb(216 180 254);
}
</style>
