<script setup lang="ts">
const { data: incidents } = await useFetch('/api/incidents')
const { data: activityTypes } = await useFetch('/api/activity-types')
const { data: excuses } = await useFetch('/api/excuses')
const { data: quotes } = await useFetch('/api/quotes')

const isAdmin = ref(false)

const excuseChartColors = [
  'rgb(34 197 94)',
  'rgb(59 130 246)',
  'rgb(249 115 22)',
  'rgb(236 72 153)',
  'rgb(168 85 247)'
]

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

  const cancellationRate = list.length
    ? Math.round((cancelled.length / list.length) * 100)
    : 0

  const totalCancellationNotice = cancelled.reduce((sum: number, x: any) => {
    return sum + Number(x.cancelledNoticeMinutes || 0)
  }, 0)

  const avgCancellationNotice = cancelled.length
    ? Math.round(totalCancellationNotice / cancelled.length)
    : 0

  const shortestCancellationNotice = cancelled.length
    ? Math.min(...cancelled.map((x: any) => Number(x.cancelledNoticeMinutes || 0)))
    : 0

  const totalExcuses = list.reduce((sum: number, x: any) => {
    return sum + (x.excuses?.length || 0)
  }, 0)

  const excusesPerIncident = list.length
    ? Math.round((totalExcuses / list.length) * 10) / 10
    : 0

  const latestIncident = list.length
    ? [...list].sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })[0]
    : null

  const daysSinceLastIncident = latestIncident
    ? Math.floor(
        (Date.now() - new Date(latestIncident.date).getTime()) /
        (1000 * 60 * 60 * 24)
      )
    : 0

  const worstSeverityIncident = list.length
    ? [...list].sort((a: any, b: any) => {
        const severityDiff = Number(b.severity || 0) - Number(a.severity || 0)

        if (severityDiff !== 0) {
          return severityDiff
        }

        return Number(b.delayMinutes || 0) - Number(a.delayMinutes || 0)
      })[0]
    : null

  return {
    total: list.length,
    late: late.length,
    cancelled: cancelled.length,
    avgDelay,
    totalDelay,
    worstDelay,
    cancellationRate,
    avgCancellationNotice,
    shortestCancellationNotice,
    excusesPerIncident,
    daysSinceLastIncident,
    worstSeverityIncident
  }
})

const seasonQuote = computed(() => {
  return (quotes.value || []).find((quote: any) => {
    return quote.text === 'Sæsonen er lang'
  })
})

const seasonProgress = computed(() => {
  const now = new Date()
  const year = now.getFullYear()

  const start = new Date(year, 2, 1) // 1. marts
  const end = new Date(year, 9, 31, 23, 59, 59) // 31. oktober

  if (now < start) {
    return 0
  }

  if (now > end) {
    return 100
  }

  const total = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()

  return Math.round((elapsed / total) * 100)
})

function cancellationNoticeColor(value: number) {
  if (value >= 60) {
    return 'text-green-300'
  }

  if (value >= 15) {
    return 'text-yellow-300'
  }

  if (value >= 0) {
    return 'text-orange-300'
  }

  return 'text-red-300'
}

function excusesPerIncidentColor(value: number) {
  if (value <= 1.5) {
    return 'text-green-300'
  }

  if (value <= 2.5) {
    return 'text-yellow-300'
  }

  return 'text-red-300'
}

function daysSinceIncidentColor(days: number) {
  if (days >= 14) {
    return 'text-green-300'
  }

  if (days >= 7) {
    return 'text-yellow-300'
  }

  if (days >= 3) {
    return 'text-orange-300'
  }

  return 'text-red-300'
}

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
    .map(([value, count], index) => ({
      value,
      label: excuseLabels.value[value] || value,
      count,
      color: excuseChartColors[index % excuseChartColors.length],
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

const riskiestActivityType = computed(() => {
  const groups: Record<string, {
    totalDelay: number
    lateCount: number
    cancelledCount: number
    totalCount: number
  }> = {}

  for (const incident of incidents.value || []) {
    const type = incident.activityType

    if (!groups[type]) {
      groups[type] = {
        totalDelay: 0,
        lateCount: 0,
        cancelledCount: 0,
        totalCount: 0
      }
    }

    groups[type].totalCount += 1

    if (incident.status === 'late') {
      groups[type].lateCount += 1
      groups[type].totalDelay += Number(incident.delayMinutes || 0)
    }

    if (incident.status === 'cancelled') {
      groups[type].cancelledCount += 1
    }
  }

  const ranked = Object.entries(groups)
    .map(([value, group]) => {
      const avgDelay = group.lateCount
        ? group.totalDelay / group.lateCount
        : 0

      const cancellationRate = group.totalCount
        ? group.cancelledCount / group.totalCount
        : 0

      return {
        value,
        label: activityTypeLabels.value[value] || value,
        score: Math.round(avgDelay + cancellationRate * 60),
        avgDelay: Math.round(avgDelay),
        cancelledCount: group.cancelledCount
      }
    })
    .sort((a, b) => b.score - a.score)

  return ranked[0] || null
})

function circleStyle(value: number, max: number, color = 'rgb(168 85 247)') {
  const percentage = Math.min(
    100,
    Math.max(
      0,
      Math.round((value / max) * 100)
    )
  )

  return {
    background: `conic-gradient(${color} ${percentage}%, rgb(30 41 59) 0)`
  }
}

function delayCircleStyle(value: number, max: number) {
  const percentage = Math.min(
    100,
    Math.max(
      0,
      Math.round((value / Math.max(max, 1)) * 100)
    )
  )

  let color = 'rgb(34 197 94)'

  if (percentage >= 75) {
    color = 'rgb(239 68 68)'
  } else if (percentage >= 50) {
    color = 'rgb(249 115 22)'
  } else if (percentage >= 25) {
    color = 'rgb(234 179 8)'
  }

  return {
    background: `conic-gradient(${color} ${percentage}%, rgb(30 41 59) 0)`
  }
}

function donutStyle(items: any[]) {
  let current = 0

  const segments = items.map((item) => {
    const start = current
    const end = current + item.percentage

    current = end

    return `${item.color} ${start}% ${end}%`
  })

  if (!segments.length) {
    segments.push('rgb(30 41 59) 0% 100%')
  }

  return {
    background: `conic-gradient(${segments.join(', ')})`
  }
}

function excuseColor(value: string) {
  return excuseDistribution.value.find((item) => {
    return item.value === value
  })?.color || 'rgb(148 163 184)'
}

function rankingClasses(index: number) {
  if (index === 0) {
    return 'bg-yellow-400/20 text-yellow-300'
  }

  if (index === 1) {
    return 'bg-slate-300/20 text-slate-200'
  }

  if (index === 2) {
    return 'bg-orange-700/30 text-orange-300'
  }

  return 'bg-slate-700/40 text-slate-300'
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
      <div class="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
        <img
          src="/favicon.png"
          alt="Emil Mødeustabil"
          class="h-9 w-9 rounded-xl shadow-lg shadow-purple-500/20"
        >

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
          Sandsynligvis forsinket
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
            :style="delayCircleStyle(stats.avgDelay, stats.worstDelay)"
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
            :style="circleStyle(stats.totalDelay, 600, 'rgb(59 130 246)')"
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

        <article class="dashboard-card">
          <div
            class="circle"
            :style="circleStyle(stats.cancellationRate, 100, 'rgb(239 68 68)')"
          >
            <div class="circle-inner">
              <p class="text-2xl font-black">
                {{ stats.cancellationRate }}%
              </p>
            </div>
          </div>

          <p class="mt-3 text-center text-sm font-bold">
            Aflysningsrate
          </p>
        </article>

        <article class="dashboard-card">
          <div
            class="circle"
            :style="circleStyle(seasonProgress, 100, 'rgb(34 197 94)')"
          >
            <div class="circle-inner">
              <p class="text-2xl font-black">
                {{ seasonProgress }}%
              </p>
            </div>
          </div>
        
          <p class="mt-3 text-center text-sm font-bold">
            “Sæsonen er lang”
          </p>
        
          <p class="mt-1 text-center text-xs text-slate-500">
            sagt {{ seasonQuote?.count || 0 }} gange
          </p>
        </article>
      </section>

      <section class="mt-4 grid gap-3 md:grid-cols-4">
        <article class="mini-kpi">
          <p class="mini-kpi-label">
            Gns. aflysningsvarsel
          </p>

          <p class="mini-kpi-value" :class="cancellationNoticeColor(stats.avgCancellationNotice)">
            {{ formatMinutes(stats.avgCancellationNotice) }}
          </p>
        </article>

        <article class="mini-kpi">
          <p class="mini-kpi-label">
            Dårligste varsel
          </p>

          <p class="mini-kpi-value" :class="cancellationNoticeColor(stats.shortestCancellationNotice)">
            {{ formatMinutes(stats.shortestCancellationNotice) }}
          </p>
        </article>

        <article class="mini-kpi">
          <p class="mini-kpi-label">
            Undskyldninger pr. hændelse
          </p>

          <p class="mini-kpi-value" :class="excusesPerIncidentColor(stats.excusesPerIncident)">
            {{ stats.excusesPerIncident }}
          </p>
        </article>

        <article class="mini-kpi">
          <p class="mini-kpi-label">
            Dage siden sidste hændelse
          </p>

          <p class="mini-kpi-value" :class="daysSinceIncidentColor(stats.daysSinceLastIncident)">
            {{ stats.daysSinceLastIncident }}
          </p>
        </article>
      </section>

      <section class="mt-4 grid gap-4 md:grid-cols-2">
        <article class="panel">
          <h2 class="text-lg font-black">
            Mest alvorlige hændelse
          </h2>

          <p class="text-xs text-slate-500">
            Højeste alvorlighed, forsinkelse som tie-breaker
          </p>

          <div
            v-if="stats.worstSeverityIncident"
            class="mt-5 rounded-2xl bg-slate-900/70 p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-bold">
                  {{ stats.worstSeverityIncident.title || activityTypeLabels[stats.worstSeverityIncident.activityType] || 'Uden titel' }}
                </p>

                <p class="mt-1 text-xs font-bold uppercase tracking-wide text-blue-300">
                  {{
                    activityTypeLabels[stats.worstSeverityIncident.activityType] ||
                    stats.worstSeverityIncident.activityType
                  }}
                </p>

                <p class="mt-2 text-sm text-slate-400">
                  {{
                    stats.worstSeverityIncident.status === 'late'
                      ? `${formatMinutes(stats.worstSeverityIncident.delayMinutes)} forsinket`
                      : `aflyst ${formatMinutes(stats.worstSeverityIncident.cancelledNoticeMinutes)} før`
                  }}
                </p>
              </div>

              <span
                class="rounded-full px-3 py-1 text-xs font-bold"
                :class="severityClasses(stats.worstSeverityIncident.severity)"
              >
                {{ stats.worstSeverityIncident.severity }}
              </span>
            </div>
          </div>

          <p v-else class="mt-5 text-sm text-slate-500">
            Ingen hændelser endnu.
          </p>
        </article>

        <article class="panel">
          <h2 class="text-lg font-black">
            Mest risikable aktivitet
          </h2>

          <p class="text-xs text-slate-500">
            Baseret på forsinkelse + aflysningsrate
          </p>

          <div
            v-if="riskiestActivityType"
            class="mt-5 rounded-2xl bg-slate-900/70 p-4"
          >
            <p class="text-2xl font-black">
              {{ riskiestActivityType.label }}
            </p>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-white/[0.04] p-3">
                <p class="text-xs text-slate-500">
                  Gns. forsinkelse
                </p>

                <p class="mt-1 text-lg font-black text-blue-300">
                  {{ formatMinutes(riskiestActivityType.avgDelay) }}
                </p>
              </div>

              <div class="rounded-2xl bg-white/[0.04] p-3">
                <p class="text-xs text-slate-500">
                  Aflysninger
                </p>

                <p class="mt-1 text-lg font-black text-red-300">
                  {{ riskiestActivityType.cancelledCount }}
                </p>
              </div>
            </div>
          </div>

          <p v-else class="mt-5 text-sm text-slate-500">
            Ingen aktivitetstyper endnu.
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
              v-for="(excuse, index) in topExcuses"
              :key="excuse.value"
              class="ranking-row"
            >
              <div class="flex items-center gap-3">
                <span
                  class="h-3 w-3 rounded-full"
                  :style="{ background: excuseColor(excuse.value) }"
                />

                <div>
                  <p class="font-bold">
                    {{ excuse.label }}
                  </p>

                  <p class="text-xs text-slate-500">
                    {{ excuse.count }} gange
                  </p>
                </div>
              </div>

              <span
                class="ranking-pill"
                :class="rankingClasses(index)"
              >
                #{{ index + 1 }}
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
                  class="h-full rounded-full"
                  :style="{
                    width: `${excuse.percentage}%`,
                    background: excuse.color
                  }"
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
            Mest forsinkede aktiviteter
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

              <span class="ranking-pill blue-pill">
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
            Mest aflyste aktiviteter
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

              <span class="ranking-pill red-pill">
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

          <span class="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
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
                  {{ incident.title || activityTypeLabels[incident.activityType] || 'Uden titel' }}
                </h3>

                <p class="mt-1 text-xs font-bold uppercase tracking-wide text-blue-300">
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

.mini-kpi {
  border-radius: 1.5rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  background: rgb(255 255 255 / 0.04);
  padding: 1rem;
}

.mini-kpi-label {
  font-size: 0.75rem;
  color: rgb(148 163 184);
}

.mini-kpi-value {
  margin-top: 0.4rem;
  font-size: 1.35rem;
  font-weight: 900;
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
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
}

.blue-pill {
  background: rgb(59 130 246 / 0.2);
  color: rgb(147 197 253);
}

.red-pill {
  background: rgb(239 68 68 / 0.2);
  color: rgb(252 165 165);
}
</style>
