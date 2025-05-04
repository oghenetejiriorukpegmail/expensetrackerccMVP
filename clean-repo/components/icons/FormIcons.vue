<script>
import { defineComponent, h } from 'vue';

// Dropdown Chevron Icon
export const ChevronDownIcon = defineComponent({
  name: 'ChevronDownIcon',
  render: () => h('svg', {
    class: 'h-5 w-5 text-gray-400',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Calendar Icon
export const CalendarIcon = defineComponent({
  name: 'CalendarIcon',
  render: () => h('svg', {
    class: 'h-5 w-5 text-gray-400',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Location Pin Icon
export const LocationIcon = defineComponent({
  name: 'LocationIcon',
  render: () => h('svg', {
    class: 'h-5 w-5 text-gray-400',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Document Icon
export const DocumentIcon = defineComponent({
  name: 'DocumentIcon',
  render: () => h('svg', {
    class: 'h-6 w-6 text-primary-500 dark:text-primary-400',
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    })
  ])
});

// Eye Icon
export const EyeIcon = defineComponent({
  name: 'EyeIcon',
  render: () => h('svg', {
    class: 'h-3 w-3 mr-1',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      d: 'M10 12a2 2 0 100-4 2 2 0 000 4z'
    }),
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Trash Icon
export const TrashIcon = defineComponent({
  name: 'TrashIcon',
  render: () => h('svg', {
    class: 'h-3 w-3 mr-1',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Upload Icon
export const UploadIcon = defineComponent({
  name: 'UploadIcon',
  render: () => h('svg', {
    class: 'h-5 w-5 mr-2 text-gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Camera Icon
export const CameraIcon = defineComponent({
  name: 'CameraIcon',
  render: () => h('svg', {
    class: 'h-5 w-5 mr-2 text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Magic Wand Icon
export const MagicWandIcon = defineComponent({
  name: 'MagicWandIcon',
  render: () => h('svg', {
    class: 'h-5 w-5 mr-2',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Spinner Icon
export const SpinnerIcon = defineComponent({
  name: 'SpinnerIcon',
  render: () => h('svg', {
    class: 'animate-spin h-4 w-4 mr-1',
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24'
  }, [
    h('circle', {
      class: 'opacity-25',
      cx: '12',
      cy: '12',
      r: '10',
      stroke: 'currentColor',
      'stroke-width': '4'
    }),
    h('path', {
      class: 'opacity-75',
      fill: 'currentColor',
      d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
    })
  ])
});

// Success Checkmark Icon
export const CheckmarkIcon = defineComponent({
  name: 'CheckmarkIcon',
  render: () => h('svg', {
    class: 'h-6 w-6 text-green-400',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Info Icon
export const InfoIcon = defineComponent({
  name: 'InfoIcon',
  render: () => h('svg', {
    class: 'h-4 w-4 mr-1',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Warning Icon
export const WarningIcon = defineComponent({
  name: 'WarningIcon',
  render: () => h('svg', {
    class: 'h-6 w-6 text-yellow-600 dark:text-yellow-400',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Error Icon
export const ErrorIcon = defineComponent({
  name: 'ErrorIcon',
  render: () => h('svg', {
    class: 'h-5 w-5 text-red-400',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Odometer Icon
export const OdometerIcon = defineComponent({
  name: 'OdometerIcon',
  render: () => h('svg', {
    class: 'h-5 w-5 text-gray-400',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  }, [
    h('circle', {
      cx: '12',
      cy: '12',
      r: '10'
    }),
    h('polyline', {
      points: '12 6 12 12 16 14'
    })
  ])
});

// Purpose/Question Icon
export const QuestionIcon = defineComponent({
  name: 'QuestionIcon',
  render: () => h('svg', {
    class: 'h-5 w-5 text-gray-400',
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 20 20',
    fill: 'currentColor'
  }, [
    h('path', {
      'fill-rule': 'evenodd',
      d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z',
      'clip-rule': 'evenodd'
    })
  ])
});

// Camera Preview Icon
export const CameraPreviewIcon = defineComponent({
  name: 'CameraPreviewIcon',
  render: () => h('svg', {
    class: 'h-6 w-6 text-indigo-500 dark:text-indigo-400',
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
    }),
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M15 13a3 3 0 11-6 0 3 3 0 016 0z'
    })
  ])
});
</script>