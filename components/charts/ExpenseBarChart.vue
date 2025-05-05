<template>
  <div class="h-full w-full">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watchEffect, computed } from 'vue';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register required Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Props
const props = defineProps({
  data: {
    type: Array,
    required: true
  }
});

// Reference to the canvas element
const chartRef = ref(null);
// Reference to the chart instance
let chart = null;

// Prepare chart data from props
const chartData = computed(() => {
  const labels = props.data.map(item => item.month);
  const values = props.data.map(item => item.amount);
  
  return {
    labels,
    datasets: [{
      label: 'Expenses',
      data: values,
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
      borderRadius: 4,
      hoverBackgroundColor: 'rgba(75, 192, 192, 0.8)',
      barThickness: 20,
      maxBarThickness: 30
    }]
  };
});

// Chart configuration
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const value = context.raw;
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(value);
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return '$' + value.toLocaleString();
        }
      }
    }
  }
};

// Initialize and update chart
const initChart = () => {
  if (!chartRef.value) return;
  
  const ctx = chartRef.value.getContext('2d');
  
  // Destroy previous chart instance if it exists
  if (chart) {
    chart.destroy();
  }
  
  // Create new chart
  chart = new Chart(ctx, {
    type: 'bar',
    data: chartData.value,
    options: chartOptions
  });
};

// Setup chart and update when data changes
onMounted(() => {
  watchEffect(() => {
    if (props.data.length > 0) {
      // Use nextTick to ensure DOM is updated
      nextTick(() => {
        initChart();
      });
    }
  });
});
</script>