<template>
  <div class="h-full w-full">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watchEffect, computed, nextTick } from 'vue';
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js';
import { capitalize } from '~/utils/string-helpers';

// Register required Chart.js components
Chart.register(ArcElement, Tooltip, Legend, PieController);

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

// Format category names for better display
const formatCategory = (category) => {
  return capitalize(category.replace('_', ' '));
};

// Generate color scheme for the chart
const generateColors = (count) => {
  const colors = [
    'rgba(54, 162, 235, 0.8)',   // Blue
    'rgba(75, 192, 192, 0.8)',   // Teal
    'rgba(255, 99, 132, 0.8)',   // Pink
    'rgba(255, 159, 64, 0.8)',   // Orange
    'rgba(153, 102, 255, 0.8)',  // Purple
    'rgba(255, 205, 86, 0.8)',   // Yellow
    'rgba(201, 203, 207, 0.8)',  // Grey
    'rgba(0, 204, 150, 0.8)',    // Green
    'rgba(255, 99, 71, 0.8)',    // Tomato
    'rgba(106, 90, 205, 0.8)',   // Slate Blue
  ];
  
  // If we need more colors than in our predefined array, generate them
  if (count > colors.length) {
    for (let i = colors.length; i < count; i++) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      colors.push(`rgba(${r}, ${g}, ${b}, 0.8)`);
    }
  }
  
  return colors.slice(0, count);
};

// Prepare chart data from props
const chartData = computed(() => {
  const labels = props.data.map(item => formatCategory(item.category));
  const values = props.data.map(item => item.amount);
  const backgroundColors = generateColors(labels.length);
  
  return {
    labels,
    datasets: [{
      data: values,
      backgroundColor: backgroundColors,
      borderColor: 'rgba(255, 255, 255, 0.5)',
      borderWidth: 1
    }]
  };
});

// Chart configuration
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        padding: 15,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          size: 11
        }
      }
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
    type: 'pie',
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