<script setup lang="ts">
const password = ref('')
const name = ref('')
const error = ref('')

function unlock() {
  if (!password.value || !name.value) {
    error.value = 'Udfyld både kodeord og navn'
    return
  }

  localStorage.setItem('adminUnlocked', 'true')
  localStorage.setItem('adminPassword', password.value)
  localStorage.setItem('adminName', name.value)

  navigateTo('/')
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
    <section class="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h1 class="text-2xl font-black">
        Admin unlock
      </h1>

      <p class="mt-2 text-sm text-slate-400">
        Indtast dit navn og kodeord.
      </p>

      <div class="mt-6 space-y-3">
        <input
          v-model="name"
          class="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-purple-400"
          placeholder="Dit navn"
        >

        <input
          v-model="password"
          type="password"
          class="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-purple-400"
          placeholder="Kodeord"
        >

        <p
          v-if="error"
          class="text-sm text-red-400"
        >
          {{ error }}
        </p>

        <button
          class="w-full rounded-xl bg-purple-500 px-4 py-3 font-bold"
          @click="unlock"
        >
          Lås op
        </button>
      </div>
    </section>
  </main>
</template>
