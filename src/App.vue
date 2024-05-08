<template>
  <v-layout class="rounded rounded-md">
    <!-- -------------------------  панель управления    ----------------------------- -->
    <ControlPanel
      :menuNodes="nodes"
      :selectedKey="selectedKey"
      @openMainContextMenu="showMainContextMenu"
      @openTreeContextMenu="(event, node) => showContextMenu(event, node)"
      @nodeSelect="onNodeSelect"
      @nodeUnselect="onNodeUnselect"
      @changeSelectionKeys="changeSelectionKeys"
    />

    <!-- -------------------------  хэдер  ----------------------------- -->
    <AppHeader :active="active" @saveForm="saveForm()" />

    <!-- ---------------------  панель описания и настройки  ------------------------ -->
    <v-main>
      <v-card v-if="active.length === 0" max-width="400" flat>
        <h3>Выберите элемент дерева отчетов</h3>
      </v-card>

      <v-card v-else max-width="400" flat>
        <!-- -----------  панель описания и настройки для "формы отчёта пользователя (рис. 2)"  ----------- -->
        <div v-if="selected?.level === 'reportForm'" class="report-forms-container">
          <div>
            <h3>Название формы отчета</h3>

            <v-text-field v-model="currentElement.label" variant="outlined" />
          </div>

          <div class="flex flex-col gap-4">
            <h4>Макет формы отчета <span style="color: red">не загружен</span></h4>

            <div class="flex gap-4">
              <v-btn color="#eee" size="small" variant="flat" @click="() => {}"> Загрузить </v-btn>
              <v-btn color="#eee" size="small" variant="flat" @click="isExelTableOpen = true">
                Редактировать
              </v-btn>
            </div>
          </div>
        </div>

        <!-- -----------  панель описания и настройки для "для объекта листа (рис. 3)"  ----------- -->
        <div v-if="selected?.level === 'list'" class="report-forms-container">
          <div>
            <h3>Название листа</h3>

            <v-text-field v-model="currentElement.label" variant="outlined" />
          </div>
        </div>

        <!-- -----------  панель описания и настройки для "для таблицы измерений (рис. 4)"  ----------- -->
        <div v-if="selected?.level === 'tagTable'" class="flex flex-col gap-6">
          <div>
            <h3 class="font-bold">Таблица измерений</h3>
            <v-text-field v-model="currentElement.label" variant="outlined" />

            <div>
              <h3 class="font-bold">Интервал усреднения</h3>

              <div class="flex gap-2 items-center pa-2">
                <input
                  type="number"
                  min="0"
                  :max="maxValueForAveragingInterval"
                  :value="currentElement.averagingInterval"
                  @change="
                    (newwValue) => (currentElement.averagingInterval = newwValue.target.value)
                  "
                  class="outline-1-grey w-[75px]"
                />

                <v-select
                  v-model="currentElement.averagingIntervalType"
                  :items="Object.keys(averagingIntervalTypes)"
                  hide-details
                  density="compact"
                ></v-select>
              </div>
            </div>

            <div>
              <v-checkbox
                v-model="currentElement.isConsiderInvalidValues"
                label="Учитывать невалидные значения"
              ></v-checkbox>
            </div>
          </div>
        </div>

        <!-- -----------  панель описания и настройки для "для колонки значения сигнала (рис. 6)"  ----------- -->
        <div v-if="selected?.level === 'AVG'">
          <div class="flex gap-2">
            <h3 class="font-bold">Идентификатор колонки</h3>
            <span>{{ currentElement.id }}</span>
          </div>

          <div class="flex flex-col gap-4">
            <h3 class="font-bold">Количество десятичных знаков</h3>

            <input
              type="number"
              min="0"
              max="9"
              class="outline-1-grey w-[100px]"
              :value="currentElement.numberOfDecimalPlaces"
              @change="
                (newwValue) => (currentElement.numberOfDecimalPlaces = newwValue.target.value)
              "
            />
          </div>

          <div class="flex flex-col gap-2 pa-2">
            <h3 class="font-bold">Функция</h3>

            <v-select
              v-model="currentElement.averagValue"
              :value="currentElement.averagValue"
              :items="listOfFunctionsForAggregatingValues"
              hide-details
              density="compact"
            ></v-select>
          </div>

          <div class="flex flex-col gap-4 max-w-[250px]">
            <h4 class="flex justify-space-between">
              Оборудование:
              <span v-if="currentElement.equipmentLable">{{ currentElement.equipmentLable }}</span>
              <span v-else style="color: red">не назначено</span>
            </h4>
            <h4 class="flex justify-space-between">
              Сигнал:
              <span v-if="currentElement.signalLable">{{ currentElement.signalLable }}</span>
              <span v-else style="color: red">не назначен</span>
            </h4>

            <div class="flex gap-4">
              <v-btn color="#eee" size="small" variant="flat" @click="assignParameter()">
                Назначить параметр
              </v-btn>
            </div>
          </div>
        </div>

        <!-- -----------  панель описания и настройки для "для текстового поля (рис. 8)"  ----------- -->
        <div v-if="selected?.level === 'Text'">
          <div class="flex flex-col gap-2">
            <h3 class="font-bold">Название поля</h3>
            <v-text-field v-model="currentElement.label" variant="outlined" />
          </div>

          <div class="flex flex-col gap-2 pa-2">
            <h3 class="font-bold">Роль</h3>

            <v-select
              v-model="currentElement.role"
              :value="currentElement.role"
              :items="roles"
              hide-details
              density="compact"
            ></v-select>
          </div>
        </div>
      </v-card>
    </v-main>

    <!-- ---------------------  контекстное меню  ------------------------ -->

    <ContextMenu ref="MainContextMenu" :model="MainContextMenu" />
    <ContextMenu ref="ReportFormContextMenu" :model="ReportFormContextMenu" />
    <ContextMenu ref="ListContextMenu" :model="ListContextMenu" />
    <ContextMenu ref="TagTableContextMenu" :model="TagTableContextMenu" />

    <!-- ------- Рисунок 7. Панель назначения сигнала для колонки таблицы измерений --------- -->
    <v-dialog v-model="isSignalAssignmentPanelOpen" width="auto">
      <v-card max-width="600" max-height="600" title="Назначение параметра">
        <Tree
          v-model:expandedKeys="expandedKeys"
          :value="equipmentSignalNodes"
          selectionMode="single"
          class="w-full md:w-[30rem]"
          @nodeSelect="onEquipmentSignalNodesSelect"
          @nodeUnselect="onEquipmentSignalNodesUnselect"
        ></Tree>

        <template v-slot:actions>
          <div class="flex gap-6">
            <v-btn
              color="green"
              size="small"
              variant="flat"
              text="Ok"
              class="w-[125px]"
              @click="saveForm()"
            ></v-btn>
            <v-btn
              color="red"
              size="small"
              variant="flat"
              text="Отмена"
              class="w-[125px]"
              @click="isSignalAssignmentPanelOpen = false"
            ></v-btn>
          </div>
        </template>
      </v-card>
    </v-dialog>

    <!-- ------- Рисунок 9. Редактор внешнего вида отчёта (настройка макета отчёта. Панель по кнопке "Редактировать" из рис. 2) --------- -->
    <v-dialog v-model="isExelTableOpen" width="auto" class="exel-modal">
      <v-card :title="currentElement.label">
        <vue-excel-editor v-model="exelTableData">
          <vue-excel-column
            v-for="(column, i) in new Array('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K')"
            :key="i"
            :label="column"
            type="string"
            width="80px"
          />
        </vue-excel-editor>

        <template v-slot:actions>
          <div class="flex gap-2">
            <v-btn
              text="Ok"
              size="small"
              color="#eee"
              variant="flat"
              class="w-[100px]"
              @click="isExelTableOpen = false"
            ></v-btn>
            <v-btn
              text="Отмена"
              size="small"
              color="#eee"
              variant="flat"
              class="w-[100px]"
              @click="isExelTableOpen = false"
            ></v-btn>
          </div>
        </template>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
import ContextMenu from 'primevue/contextmenu'
import Tree from 'primevue/tree'
import ControlPanel from '@/components/ControlPanel.vue'
import AppHeader from '@/components/Header.vue'

import {
  removeElementById,
  addNewChildToElementById,
  getElementById,
  updateElementById
} from '@/utils/helper.js'
import CONSTANTS from '@/utils/constants.js'

export default {
  name: 'App',

  components: {
    AppHeader,
    ControlPanel,
    Tree,
    ContextMenu
  },

  data() {
    return {
      exelTableData: [],
      isExelTableOpen: false,
      expandedKeys: {},
      isSignalAssignmentPanelOpen: false,
      averagingIntervalTypes: {
        сек: {
          min: 0,
          max: 60
        },
        мин: {
          min: 0,
          max: 60
        },
        час: {
          min: 0,
          max: 24
        }
      },
      listOfFunctionsForAggregatingValues: [
        'среднее значение',
        'минимальное значение',
        'максимальное значение',
        'среднеквадратическое отклонение',
        'направление ветра (мода)',
        'последнее значение',
        'качество'
      ],
      roles: ['Период отчета', 'ФИО оператора', 'Должность оператора'],
      selectedKey: null,
      nodes: [],
      active: [],
      selectedId: null,
      currentElement: {},
      MainContextMenu: [
        {
          label: 'Добавить форму отчета',
          command: () => {
            console.log('addReportForm-ContextMenu')

            this.active = ['reportForm-level-' + Math.random().toString(16).slice(2)]
            this.selectedKey = { [this.active[0]]: true }

            // TODO: return befor build
            this.nodes.push({
              id: this.active[0],
              key: this.active[0],
              label: 'Форма отчета' + (this.nodes.length + 1),
              contextMenu: true,
              level: 'reportForm'
            })
          }
        }
      ],
      ReportFormContextMenu: [
        {
          label: 'Добавить лист',
          icon: 'pi pi-copy',
          command: () => {
            console.log('Добавить лист')

            const targetId = this.selectedId
            const newId = 'List-' + Math.random().toString(16).slice(2)

            this.selectedKey = { [newId]: true }

            this.nodes = addNewChildToElementById({
              array: this.nodes,
              targetId,
              newChild: {
                id: newId,
                contextMenu: true,
                label: 'Лист',
                level: 'list'
              }
            })

            this.active = [newId]
          }
        },
        {
          label: 'Удалить форму',
          icon: 'pi pi-copy',
          command: () => {
            console.log('Удалить форму')

            this.nodes = removeElementById({ array: this.nodes, targetId: this.selectedId })
          }
        }
      ],
      ListContextMenu: [
        {
          label: 'Добавить',
          items: [
            {
              label: 'Таблицу измерений',
              command: () => {
                console.log('Таблицу измерений')

                const targetId = this.selectedId
                const newId = 'TagTable-' + Math.random().toString(16).slice(2)
                this.selectedKey = { [newId]: true }

                this.nodes = addNewChildToElementById({
                  array: this.nodes,
                  targetId,
                  newChild: {
                    id: newId,
                    contextMenu: true,
                    label: 'TagTable',
                    averagingInterval: 30,
                    averagingIntervalType: 'сек',
                    isConsiderInvalidValues: false,
                    level: 'tagTable'
                  }
                })

                this.active = [newId]
              }
            },
            {
              label: 'Текстовое поле',
              icon: 'pi pi-copy',
              command: () => {
                console.log('Текстовое поле')

                const targetId = this.selectedId
                const newId = 'Text-' + Math.random().toString(16).slice(2)
                this.selectedKey = { [newId]: true }

                this.nodes = addNewChildToElementById({
                  array: this.nodes,
                  targetId,
                  newChild: {
                    id: newId,
                    label: 'Text',
                    level: 'Text',
                    role: this.roles[0]
                  }
                })

                this.active = [newId]
              }
            }
          ]
        },
        {
          label: 'Удалить лист',
          icon: 'pi pi-copy',
          command: () => {
            console.log('Удалить лист', this.selectedId)

            this.nodes = removeElementById({
              array: this.nodes,
              targetId: this.selectedId
            })
          }
        }
      ],
      TagTableContextMenu: [
        {
          label: 'Добавить колонку',
          items: [
            {
              label: 'Времени',
              command: () => {
                console.log('Добавить колонку: Времени')

                const targetId = this.selectedId
                const newId = 'Time-' + Math.random().toString(16).slice(2)
                this.selectedKey = { [newId]: true }

                this.nodes = addNewChildToElementById({
                  array: this.nodes,
                  targetId,
                  newChild: {
                    id: newId,
                    label: 'col',
                    appendLabelText: ': время',
                    level: 'Time'
                  }
                })

                this.active = [newId]
              }
            },
            {
              label: 'Значений сигнала',
              command: () => {
                console.log('Добавить колонку: Значений сигнала')

                const targetId = this.selectedId
                const newId = 'AVG-' + Math.random().toString(16).slice(2)
                this.selectedKey = { [newId]: true }

                this.nodes = addNewChildToElementById({
                  array: this.nodes,
                  targetId,
                  newChild: {
                    id: newId,
                    label: 'col',
                    appendLabelText: ': AVG()',
                    level: 'AVG',
                    averagingInterval: 30,
                    averagingIntervalType: 'сек',
                    isConsiderInvalidValues: false,
                    numberOfDecimalPlaces: 3,
                    averagValue: this.listOfFunctionsForAggregatingValues[0],
                    equipmentLable: null,
                    signalLable: null
                  }
                })

                this.active = [newId]
              }
            }
          ]
        },
        {
          label: 'Удалить таблицу',
          command: () => {
            console.log('Удалить таблицу', this.selectedId)

            this.nodes = removeElementById({
              array: this.nodes,
              targetId: this.selectedId
            })
          }
        }
      ]
    }
  },

  mounted() {
    this.exelTableData = new Array(17).fill({}) // создаем дефолтные данные для таблицы "формы отчета"

    // TODO: comment before build
    // ноды для тестирования дерева "панели управления"
    // this.nodes = [
    //   {
    //     id: 'reportForm-level-6480c434c16c3',
    //     key: 'reportForm-level-6480c434c16c3',
    //     label: 'Форма отчета1',
    //     contextMenu: true,
    //     level: 'reportForm',
    //     children: [
    //       {
    //         id: 'List-9303b5db0aa99',
    //         key: 'List-9303b5db0aa99',
    //         label: 'Лист1',
    //         level: 'list',
    //         children: [
    //           {
    //             id: 'TagTable-95ad1cc45c2d9',
    //             contextMenu: true,
    //             label: 'TagTable1',
    //             averagingInterval: 30,
    //             averagingIntervalType: 'сек',
    //             isConsiderInvalidValues: false,
    //             level: 'tagTable',
    //             key: 'TagTable-95ad1cc45c2d9',
    //             children: [
    //               {
    //                 id: 'AVG-501610ad71758',
    //                 label: 'col1: AVG()',
    //                 appendLabelText: ': AVG()',
    //                 level: 'AVG',
    //                 averagingInterval: 30,
    //                 averagingIntervalType: 'сек',
    //                 isConsiderInvalidValues: false,
    //                 numberOfDecimalPlaces: 3,
    //                 averagValue: 'среднее значение',
    //                 key: 'AVG-501610ad71758'
    //               },
    //               {
    //                 appendLabelText: ': время',
    //                 id: 'Time-a46464ff8be27',
    //                 key: 'Time-a46464ff8be27',
    //                 label: 'col2: время',
    //                 level: 'Time'
    //               }
    //             ]
    //           },
    //           {
    //             id: 'Text-596dc8ed7ca69',
    //             key: 'Text-596dc8ed7ca69',
    //             label: 'Text2',
    //             level: 'Text',
    //             role: 'Период отчета',
    //             contextMenu: true
    //           }
    //         ]
    //       }
    //     ]
    //   }
    // ]
  },

  watch: {
    active(val) {
      // меняем значение текущего обьекта по смене ключей из this.active
      if (val.length && this.selected) {
        this.currentElement = JSON.parse(JSON.stringify(this.selected))
      }
    }
  },

  computed: {
    // ноды для "Панели назначения сигнала для колонки таблицы измерений"
    equipmentSignalNodes() {
      return CONSTANTS.EQUIPMENT_SIGNAL_NODES
    },

    // выбранный обьект
    selected() {
      if (!this.active.length) return undefined

      const activeId = this.active[0]

      return getElementById({ array: this.nodes, targetId: activeId })
    },

    maxValueForAveragingInterval() {
      return this.currentElement.averagingIntervalType
        ? this.averagingIntervalTypes[this.currentElement.averagingIntervalType].max
        : 100
    }
  },

  methods: {
    changeSelectionKeys(data) {
      this.selectedKey = data
    },

    onNodeSelect(node) {
      console.log('onNodeSelect', node)
      this.active = [node.id]
    },

    onNodeUnselect(node) {
      console.log('onNodeUnselect', node)
      this.active = []
    },

    onEquipmentSignalNodesSelect(node) {
      console.log('onEquipmentSignalNodesSelect', node)

      if (node.key.match('signal')) {
        this.currentElement.equipmentLable = node.parent
        this.currentElement.signalLable = node.label
      }
    },

    onEquipmentSignalNodesUnselect(node) {
      console.log('onEquipmentSignalNodesUnselect', node)
    },

    saveForm() {
      console.log('saveForm')

      if (this.currentElement?.id) {
        this.nodes = updateElementById({
          array: this.nodes,
          targetId: this.currentElement.id,
          newData: this.currentElement
        })
      }

      this.isSignalAssignmentPanelOpen = false
    },

    showMainContextMenu(event) {
      this.$refs.MainContextMenu.show(event)
    },

    showContextMenu(event, node) {
      console.log('event', event)
      console.log('showContextMenu', node)

      event.stopPropagation() // не даем событию распростронятся на родительскую ноду
      event.preventDefault() // останавливаем стандартное поведение элемента

      this.selectedId = node.id

      // показываем нужное контекстное меню в зависимости от уровня элемента дерева из "панели управления"
      switch (node.level) {
        case 'list':
          this.$refs.ListContextMenu.show(event)
          break
        case 'reportForm':
          this.$refs.ReportFormContextMenu.show(event)
          break
        case 'tagTable':
          this.$refs.TagTableContextMenu.show(event)
          break
      }
    },

    assignParameter() {
      console.log('assignParameter', this.currentElement)
      this.isSignalAssignmentPanelOpen = true
      this.expandedKeys[this.equipmentSignalNodes[0].key] = true
    }
  }
}
</script>

<style>
.p-treenode-children {
  margin-left: 12px;
}

.p-treenode-label {
  width: 100%;
  display: flex;
  align-items: center;
}

.outline-1-grey {
  border: 1px solid grey;
}

.custom-full {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
}

.v-card-actions {
  position: fixed;
  bottom: 0;
  background-color: white;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 9999;
}

.exel-modal .v-card-actions {
  margin-bottom: -52px;
  justify-content: flex-end;
}
</style>
