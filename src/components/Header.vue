<template>
  <v-app-bar>
    <div class="pa-4">
      <div class="flex gap-4">
        <v-btn
          color="#eee"
          size="small"
          variant="flat"
          :disabled="!active.length"
          @click="$emit('saveForm')"
        >
          Сохранить
        </v-btn>
        <v-btn
          color="#eee"
          size="small"
          variant="flat"
          :disabled="!active.length"
          @click="$emit('cancel')"
        >
          Отменить
        </v-btn>
      </div>
    </div>
  </v-app-bar>
</template>

<script>
export default {
  name: 'HeaderComponent',

  props: {
    active: {
      type: Array,
      default: () => []
    }
  }
}
</script>
