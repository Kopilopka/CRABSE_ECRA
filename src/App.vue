<template>
  <v-layout class="rounded rounded-md">
    <v-navigation-drawer :width="350">
      <div class="navigation" @contextmenu="addReportForm">
        <v-text-field label="Найти"></v-text-field>

        <div v-if="reportForms.length" class="report-forms-menu">
          <div v-for="(report, i) in reportForms" :key="i">
            <div @contextmenu="addReportList($event, report)">
              <v-treeview
                v-model:activated="active"
                v-model:opened="open"
                activatable
                density="compact"
                item-title="title"
                item-value="id"
                :items="[report]"
              ></v-treeview>
            </div>
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
          <v-btn color="#eee" size="small" variant="flat" @click="saveForms()"> Сохранить </v-btn>
          <v-btn color="#eee" size="small" variant="flat" @click="() => {}"> Отменить </v-btn>
        </div>
      </div>
    </v-app-bar>

    <v-main class="d-flex flex-column">
      <v-card v-if="active.length === 0" class="pa-6" max-width="400" flat>
        <h3>Выберите элемент дерева отчетов</h3>
      </v-card>

      <v-card v-else class="pa-6" max-width="400" flat>
        <div v-if="selected.level === 'reportForm'" class="report-forms-container">
          <div>
            <h3>Название формы отчета</h3>

            <v-text-field v-if="selected" v-model="currentElement.title"></v-text-field>
            <!-- @input="(newText) => changeReportTitle(newText, selected.id)" -->
          </div>

          <div class="d-flex flex-column gap-4">
            <h4>Макет формы отчета <span style="color: red">не загружен</span></h4>

            <div class="d-flex gap-4">
              <v-btn color="#eee" size="small" variant="flat" @click="() => {}"> Загрузить </v-btn>
              <v-btn color="#eee" size="small" variant="flat" disabled @click="() => {}">
                Редактировать
              </v-btn>
            </div>
          </div>
        </div>

        <div v-if="selected.level === 'list'" class="report-forms-container">
          <div>
            <h3>Название листа</h3>

            <v-text-field v-if="selected" v-model="currentElement.title" />
            <!-- @input="(newText) => changeReportTitle(newText, selected.id - 1)" -->
          </div>
        </div>
      </v-card>
    </v-main>

    <ContextMenu ref="addReportListContextMenu" :model="addReportListContextMenu" />
    <ContextMenu ref="addReportFormContextMenu" :model="addReportFormContextMenu" />
  </v-layout>
</template>

<script>
import ContextMenu from 'primevue/contextmenu'

export default {
  name: 'App',

  components: {
    ContextMenu
  },

  data() {
    return {
      active: [],
      open: [],
      reportForms: [],
      selectedId: null,
      currentElement: {},
      currentMode: null,
      addReportFormContextMenu: [
        {
          label: 'Добавить форму отчета',
          icon: 'pi pi-copy',
          command: () => {
            console.log('addReportForm-ContextMenu')

            this.currentMode = 'editReportForm'
            this.active = ['reportForm-level-' + Math.random().toString(16).slice(2)]

            const reportForm = {
              // id: 'reportForm-level-' + Math.random().toString(16).slice(2),
              id: this.active[0],
              title: 'Форма отчета' + (this.reportForms.length + 1),
              level: 'reportForm'
              // children: [
              //   {
              //     id: 3,
              //     title: 'TagTable1',
              //     children: [
              //       { id: 4, title: 'col0: время' },
              //       { id: 5, title: 'col1: AVG()' }
              //     ]
              //   },
              //   {
              //     id: 6,
              //     title: 'LogTable1'
              //   },
              //   {
              //     id: 7,
              //     title: 'Text1'
              //   }
              // ]
            }

            this.reportForms.push(reportForm)
          }
        }
      ],
      addReportListContextMenu: [
        {
          label: 'Добавить лист',
          icon: 'pi pi-copy',
          command: (e) => {
            console.log('Добавить лист', e)

            const id = this.selectedId
            this.currentMode = 'editList'
            this.active = ['list-level-' + Math.random().toString(16).slice(2)]

            this.reportForms = this.reportForms.map((report) => {
              if (report.id === id) {
                if (report.children && report.children.length) {
                  report.children = [...report.children]
                } else {
                  report.children = []
                }

                report.children.push({
                  id: this.active[0],
                  title: 'Лист ' + (report.children.length + 1),
                  level: 'list'
                })
              }

              return report
            })
          }
        },
        {
          label: 'Удалить форму',
          icon: 'pi pi-copy',
          command: () => {
            console.log('Удалить форму')

            this.reportForms = this.reportForms.filter((report) => report.id !== this.selectedId)
          }
        }
      ]
    }
  },

  watch: {
    active(val) {
      if (val.length) {
        this.isEditMode = true

        if (this.selected) {
          this.currentElement = JSON.parse(JSON.stringify(this.selected))
        }
      }
    }
  },

  computed: {
    selected() {
      if (!this.active.length) return undefined

      const activeId = this.active[0]

      function getElement(array) {
        return array.reduce((acc, item) => {
          if (item.id === activeId) {
            acc = item

            return acc
          }

          if (item.children?.length) {
            acc = getElement(item.children)
          }

          return acc
        }, {})
      }

      return getElement(JSON.parse(JSON.stringify(this.reportForms)))
    }
  },

  methods: {
    saveForms() {
      console.log('saveForms')

      const setTitle = (array) => {
        return array.reduce((acc, item) => {
          if (item.id === this.currentElement.id) {
            item.title = this.currentElement.title
          }

          if (item.children?.length) {
            item.children = setTitle(item.children)
          }

          acc.push(item)
          return acc
        }, [])
      }

      if (this.currentElement && this.currentElement.id) {
        this.reportForms = setTitle(JSON.parse(JSON.stringify(this.reportForms)))
      }
    },

    changeReportTitle(newText, id) {
      function setTitle(array) {
        return array.map((item) => {
          if (item.id === id) {
            if (newText.data) {
              item.title += newText.data
            } else {
              item.title = item.title.slice(0, -1)
            }

            return item
          }

          if (item.children?.length) {
            return setTitle(item.children)
          }

          return item
        }, {})
      }

      this.currentElement = setTitle(JSON.parse(JSON.stringify(this.reportForms)))[0]
    },

    addReportList(event, report) {
      console.log('addReportList', report)
      this.selectedId = report.id
      this.$refs.addReportListContextMenu.show(event)
    },

    removeList() {
      console.log('removeList')
    },

    addList() {
      console.log('addList')
    },

    addReportForm(event) {
      this.$refs.addReportFormContextMenu.show(event)
    }
  }
}
</script>

<style>
.navigation {
  padding: 10px 25px;
  display: grid;
  grid-template-rows: max-content 1fr;
  height: 100vh;
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

.p-contextmenu .p-contextmenu-root-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 5px;
}
</style>
