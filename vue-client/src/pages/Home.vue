<template>
  <div>
    <h1>Dashboard Stats</h1>
    <div v-if="stats">
      <p>Contracts: {{ stats.contracts }}</p>
      <p>Payments Due: {{ stats.payments_due }}</p>
      <p>Expenses: {{ stats.expenses }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const stats = ref(null)

onMounted(async () => {
  const res = await axios.get('/api/stats')
  stats.value = res.data
})
</script>
