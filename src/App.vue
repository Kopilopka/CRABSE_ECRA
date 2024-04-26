<template>
  <v-layout class="rounded rounded-md">
    <v-navigation-drawer :width="350">
      <div class="navigation TEST">
        <v-text-field label="Найти"></v-text-field>
        <div v-if="reportForms.length" class="report-forms">
          <div v-for="(report, i) in reportForms" :key="i">
            <p>{{ report }}</p>
          </div>
        </div>
        <p v-else>
          Для добавления новых форм отчета и дальнейшего их редактироваия, воспользуйтесь
          контекстным меню
        </p>
      </div>
    </v-navigation-drawer>

    <v-app-bar>
      <div class="flex pa-4">
        <div class="flex gap-4">
          <v-btn color="#eee" size="small" variant="flat" @click="reportForms.push('Item-1')">
            Сохранить
          </v-btn>
          <v-btn color="#eee" size="small" variant="flat"> Отменить </v-btn>
        </div>
      </div>
    </v-app-bar>

    <v-main class="d-flex align-center justify-center" style="min-height: 300px">
      Выберите элемент дерева отчетов
    </v-main>
  </v-layout>
</template>

<script>
export default {
  name: 'App',

  components: {},

  data: () => ({
    reportForms: []
  })
}
</script>

<style>
.navigation {
  padding: 10px 25px;
  display: grid;
  grid-template-rows: max-content 1fr;
}

.flex {
  display: flex;
}

.gap-4 {
  gap: 12px;
}
.pa-4 {
  padding: 12px;
}
</style>
