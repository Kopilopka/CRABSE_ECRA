<template>
  <v-layout class="rounded rounded-md">
    <!-- -------------------------  панель управления    ----------------------------- -->
    <ControlPanel
      :menuNodes="nodes"
      :selectedKey="selectedKey"
      :expandedKeys="controlPanelExpandedKeys"
      @openMainContextMenu="showMainContextMenu"
      @openTreeContextMenu="(event, node) => showContextMenu(event, node)"
      @nodeSelect="onNodeSelect"
      @nodeUnselect="onNodeUnselect"
      @changeSelectionKeys="changeSelectionKeys"
    />

    <!-- -------------------------  хэдер  ----------------------------- -->
    <AppHeader
      :active="active"
      :currentElement="currentElement"
      @saveForm="saveForm()"
      @generateReport="generateReport()"
    />

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
            <h4>
              Макет формы отчета
              <span v-if="currentElement.isReportFormDownloaded && !loading" style="color: green"
                >загружен</span
              >
              <span v-else style="color: red">не загружен</span>
            </h4>

            <div class="flex gap-4">
              <v-btn
                color="#eee"
                size="small"
                variant="flat"
                :loading="loading"
                @click="downloadReportForm()"
              >
                Загрузить
              </v-btn>

              <div class="flex flex-col">
                <v-btn
                  color="#eee"
                  size="small"
                  variant="flat"
                  :disabled="currentElement.isReportFormDownloaded === false"
                  @click="editReportForm()"
                >
                  Редактировать
                </v-btn>

                <span class="text-red"> {{ error }}</span>
              </div>
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
    <ContextMenu ref="ColumnContextMenu" :model="ColumnContextMenu" />

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

    <!-- ------- Рисунок 10. Выбор таблицы или значений отображения отчёта --------- -->
    <v-dialog
      v-model="selectingTableDisplayValues"
      width="auto"
      class="signalAssignmentPanel-modal"
    >
      <v-card max-width="600" max-height="600" min-height="400">
        <v-card-title>
          <v-text-field label="Найти"></v-text-field>
        </v-card-title>

        <Tree
          v-model:expandedKeys="selectingTableDisplayValuesExpandedKeys"
          v-model:selectionKeys="signalAssignmentPanelSelectedKey"
          :value="
            currentElement.children[selectedSheet.index].children.filter(
              (item) => item.level === 'tagTable'
            )
          "
          selectionMode="single"
          class="w-full md:w-[30rem]"
          @nodeSelect="selectFromSelectingTableDisplayValues"
          @nodeUnselect="unselectSelectedEntity"
        ></Tree>

        <template v-slot:actions>
          <div class="flex gap-6">
            <v-btn
              color="green"
              size="small"
              variant="flat"
              text="Ok"
              class="w-[125px]"
              @click="setExcelTableData"
            ></v-btn>
            <v-btn
              color="red"
              size="small"
              variant="flat"
              text="Отмена"
              class="w-[125px]"
              @click="selectingTableDisplayValues = false"
            ></v-btn>
          </div>
        </template>
      </v-card>
    </v-dialog>

    <!-- ------- Рисунок 9. Редактор внешнего вида отчёта (настройка макета отчёта. Панель по кнопке "Редактировать" из рис. 2) --------- -->
    <v-dialog v-model="isExelTableOpen" width="auto" class="exel-modal">
      <v-card :title="currentElement.label">
        <template v-slot:prepend>
          <div class="flex gap-4 pa-4">
            <v-btn
              color="#eee"
              variant="flat"
              class="w-[100px]"
              :disabled="!isFocused"
              @click="showReportFormTree()"
            >
              <v-icon color="success" size="x-large" icon="mdi-plus"></v-icon>
            </v-btn>

            <v-btn color="#eee" variant="flat" class="w-[100px]" @click="saveExcelTable()">
              <v-icon color="success" size="x-large" icon="mdi-check"></v-icon>
            </v-btn>
          </div>
        </template>

        <div v-for="(table, i) in currentElement.children" :key="i">
          <vue-excel-editor
            v-if="i === selectedSheet.index"
            v-model="table.excelTableData"
            @cell-focus="cellFocus"
            @cell-blur="cellBlur"
          >
            <vue-excel-column
              v-for="(columnLetter, i) in columnLetters"
              :key="i"
              :label="columnLetter"
              :field="'column' + columnLetter"
              text-align="right"
              type="string"
              :width="computedColumnWIdth(columnLetter)"
            />
          </vue-excel-editor>
        </div>

        <template v-slot:actions>
          <div style="width: 150px">
            <v-select
              v-model="selectedSheet"
              density="compact"
              item-value="index"
              item-title="title"
              return-object
              hide-details
              :items="
                currentElement.children.map((item, index) => ({ index: index, title: item.label }))
              "
            ></v-select>
          </div>

          <div class="flex gap-2">
            <v-btn
              text="Ok"
              size="small"
              color="#eee"
              variant="flat"
              class="w-[100px]"
              @click="saveExcelTable()"
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

    <!-- ------- Модальное окно "Режима исполнения" --------- -->
    <v-dialog v-model="showGenerateReportModal" width="800px" height="600px" class="pa-4">
      <v-card title="Параметры">
        <template v-slot:text>
          <div class="h-[100vh]">
            <div class="col-2">
              <div class="text-lg">Дата, время</div>

              <v-date-input
                v-model="reportData.date"
                prepend-icon="mdi-menu-down"
                clearable
                variant="outlined"
                label="Date input"
                density="compact"
                :max="new Date().toISOString()"
              ></v-date-input>
            </div>

            <div class="col-2">
              <div class="text-lg">Период, мин</div>

              <input
                v-model="reportData.period"
                type="number"
                min="0"
                max="3600"
                class="outline-1-grey w-full"
              />
            </div>
          </div>
        </template>

        <template v-slot:actions>
          <div class="flex gap-2">
            <v-btn
              text="Ok"
              size="small"
              color="#eee"
              variant="flat"
              class="w-[100px]"
              @click="saveReport()"
            ></v-btn>
            <v-btn
              text="Отмена"
              size="small"
              color="#eee"
              variant="flat"
              class="w-[100px]"
              @click="showGenerateReportModal = false"
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
import Excel from 'exceljs'
import { saveAs } from 'file-saver'

import {
  removeElementById,
  addNewChildToElementById,
  getElementById,
  updateElementById,
  getFormatedDate,
  getCurrentTime,
  getParentElementById,
  convertDigitToLetter,
  getRandomNumber
} from '@/utils/helper.js'
import CONSTANTS from '@/utils/constants.js'

const currentDate = getFormatedDate()
const maxMinutesInDay = 1440 // мин / сутки
const checkTimeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$/

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
      reportData: {
        date: new Date(),
        period: 30
      },
      showGenerateReportModal: false,
      rowPos: null,
      colPos: null,
      error: null,
      selectedSheet: { index: 0, title: 'Лист1' },
      signalAssignmentPanelSelectedKey: {},
      columnLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
      selectedEntity: null,
      selectingTableDisplayValues: false,
      loading: false,
      lastFocusedCellId: null,
      lastFocusedСolumnName: null,
      lastFocusedRowIndex: null,
      isFocused: false,
      isExelTableOpen: false,
      expandedKeys: {},
      controlPanelExpandedKeys: {},
      selectingTableDisplayValuesExpandedKeys: {},
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

            this.nodes.push({
              id: this.active[0],
              key: this.active[0],
              label: 'Форма отчета' + (this.nodes.length + 1),
              contextMenu: true,
              level: 'reportForm',
              isReportFormDownloaded: false
            })
          }
        }
      ],
      ReportFormContextMenu: [
        {
          label: 'Добавить лист',
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
                level: 'list',
                excelTableData: this.initExcelTableData()
              }
            })

            this.active = [newId]
          }
        },
        {
          label: 'Удалить форму',
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
                    level: 'Time',
                    timestamp: getCurrentTime()
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
      ],
      ColumnContextMenu: [
        {
          label: 'Удалить',
          command: () => {
            console.log('Удалить колонку', this.selectedId)

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
    this.columnLetters = new Array(10).fill(1).map((item, i) => (item = convertDigitToLetter(i))) // генерируем название колонок (как в excel)

    // TODO: comment before build
    // ноды для тестирования дерева "панели управления"
    // this.nodes = [
    //   {
    //     id: 'reportForm-level-6480c434c16c3',
    //     key: 'reportForm-level-6480c434c16c3',
    //     label: 'Форма отчета1',
    //     contextMenu: true,
    //     level: 'reportForm',
    //     isReportFormDownloaded: false,
    //     children: [
    //       {
    //         id: 'List-9303b5db0aa99',
    //         key: 'List-9303b5db0aa99',
    //         label: 'Лист1',
    //         level: 'list',
    //         excelTableData: this.initExcelTableData(),
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
    //                 key: 'AVG-501610ad71758',
    //                 equipmentLable: 'ЗНВ-ТР-220-2Т',
    //                 signalLable: 'Ток.Фаза А'
    //               },
    //               {
    //                 appendLabelText: ': время',
    //                 id: 'Time-a46464ff8be27',
    //                 key: 'Time-a46464ff8be27',
    //                 label: 'col2: время',
    //                 level: 'Time',
    //                 timestamp: getCurrentTime()
    //               },
    //               {
    //                 id: 'AVG-501610ad71759',
    //                 label: 'col3: AVG()',
    //                 appendLabelText: ': AVG()',
    //                 level: 'AVG',
    //                 averagingInterval: 30,
    //                 averagingIntervalType: 'сек',
    //                 isConsiderInvalidValues: false,
    //                 numberOfDecimalPlaces: 3,
    //                 averagValue: 'среднее значение',
    //                 key: 'AVG-501610ad71759',
    //                 equipmentLable: 'ЗНВ-ТР-220-2Т',
    //                 signalLable: 'Ток.Фаза B'
    //               }
    //             ]
    //           },
    //           {
    //             id: 'TagTable-95ad1cc45c2d2',
    //             contextMenu: true,
    //             label: 'TagTable2',
    //             averagingInterval: 30,
    //             averagingIntervalType: 'сек',
    //             isConsiderInvalidValues: false,
    //             level: 'tagTable',
    //             key: 'TagTable-95ad1cc45c2d2',
    //             children: [
    //               {
    //                 id: 'AVG-501610ad71752',
    //                 label: 'col1: AVG()',
    //                 appendLabelText: ': AVG()',
    //                 level: 'AVG',
    //                 averagingInterval: 30,
    //                 averagingIntervalType: 'сек',
    //                 isConsiderInvalidValues: false,
    //                 numberOfDecimalPlaces: 3,
    //                 averagValue: 'среднее значение',
    //                 key: 'AVG-501610ad71752',
    //                 equipmentLable: 'ЗНВ-ТР-220-2Т',
    //                 signalLable: 'Ток.Фаза C'
    //               },
    //               {
    //                 appendLabelText: ': время',
    //                 id: 'Time-a46464ff8be22',
    //                 key: 'Time-a46464ff8be22',
    //                 label: 'col2: время',
    //                 level: 'Time',
    //                 timestamp: getCurrentTime()
    //               },
    //               {
    //                 id: 'AVG-501610ad71753',
    //                 label: 'col3: AVG()',
    //                 appendLabelText: ': AVG()',
    //                 level: 'AVG',
    //                 averagingInterval: 30,
    //                 averagingIntervalType: 'сек',
    //                 isConsiderInvalidValues: false,
    //                 numberOfDecimalPlaces: 3,
    //                 averagValue: 'среднее значение',
    //                 key: 'AVG-501610ad71753',
    //                 equipmentLable: 'ЗНВ-ТР-220-2Т',
    //                 signalLable: 'Ток.Фаза D'
    //               }
    //             ]
    //           },
    //           {
    //             id: 'Text-596dc8ed7ca69',
    //             key: 'Text-596dc8ed7ca69',
    //             label: 'Text3',
    //             level: 'Text',
    //             role: 'Период отчета',
    //             contextMenu: true
    //           }
    //         ]
    //       },
    //       {
    //         id: 'List-9303b5db0aa92',
    //         key: 'List-9303b5db0aa92',
    //         label: 'Лист2',
    //         level: 'list',
    //         excelTableData: this.initExcelTableData(),
    //         children: [
    //           {
    //             id: 'TagTable-95ad1cc45c2d1',
    //             contextMenu: true,
    //             label: 'TagTable1',
    //             averagingInterval: 30,
    //             averagingIntervalType: 'сек',
    //             isConsiderInvalidValues: false,
    //             level: 'tagTable',
    //             key: 'TagTable-95ad1cc45c2d1',
    //             children: [
    //               {
    //                 id: 'AVG-501610ad71751',
    //                 label: 'col1: AVG()',
    //                 appendLabelText: ': AVG()',
    //                 level: 'AVG',
    //                 averagingInterval: 30,
    //                 averagingIntervalType: 'сек',
    //                 isConsiderInvalidValues: false,
    //                 numberOfDecimalPlaces: 3,
    //                 averagValue: 'среднее значение',
    //                 key: 'AVG-501610ad71751',
    //                 equipmentLable: 'ЗНВ-ТР-220-2Т',
    //                 signalLable: 'Ток.Фаза А'
    //               },
    //               {
    //                 appendLabelText: ': время',
    //                 id: 'Time-a46464ff8be21',
    //                 key: 'Time-a46464ff8be21',
    //                 label: 'col2: время',
    //                 level: 'Time',
    //                 timestamp: getCurrentTime()
    //               },
    //               {
    //                 id: 'AVG-501610ad71745',
    //                 label: 'col3: AVG()',
    //                 appendLabelText: ': AVG()',
    //                 level: 'AVG',
    //                 averagingInterval: 30,
    //                 averagingIntervalType: 'сек',
    //                 isConsiderInvalidValues: false,
    //                 numberOfDecimalPlaces: 3,
    //                 averagValue: 'среднее значение',
    //                 key: 'AVG-501610ad71745',
    //                 equipmentLable: 'ЗНВ-ТР-220-2Т',
    //                 signalLable: 'Ток.Фаза B'
    //               }
    //             ]
    //           },
    //           {
    //             id: 'TagTable-95ad1cc45c222',
    //             contextMenu: true,
    //             label: 'TagTable2',
    //             averagingInterval: 30,
    //             averagingIntervalType: 'сек',
    //             isConsiderInvalidValues: false,
    //             level: 'tagTable',
    //             key: 'TagTable-95ad1cc45c222',
    //             children: [
    //               {
    //                 id: 'AVG-501610ad71722',
    //                 label: 'col1: AVG()',
    //                 appendLabelText: ': AVG()',
    //                 level: 'AVG',
    //                 averagingInterval: 30,
    //                 averagingIntervalType: 'сек',
    //                 isConsiderInvalidValues: false,
    //                 numberOfDecimalPlaces: 3,
    //                 averagValue: 'среднее значение',
    //                 key: 'AVG-501610ad71722',
    //                 equipmentLable: 'ЗНВ-ТР-220-2Т',
    //                 signalLable: 'Ток.Фаза C'
    //               },
    //               {
    //                 appendLabelText: ': время',
    //                 id: 'Time-a46464ff8be23',
    //                 key: 'Time-a46464ff8be23',
    //                 label: 'col2: время',
    //                 level: 'Time',
    //                 timestamp: getCurrentTime()
    //               },
    //               {
    //                 id: 'AVG-501610ad71754',
    //                 label: 'col3: AVG()',
    //                 appendLabelText: ': AVG()',
    //                 level: 'AVG',
    //                 averagingInterval: 30,
    //                 averagingIntervalType: 'сек',
    //                 isConsiderInvalidValues: false,
    //                 numberOfDecimalPlaces: 3,
    //                 averagValue: 'среднее значение',
    //                 key: 'AVG-501610ad71754',
    //                 equipmentLable: 'ЗНВ-ТР-220-2Т',
    //                 signalLable: 'Ток.Фаза D'
    //               }
    //             ]
    //           },
    //           {
    //             id: 'Text-596dc8ed7ca64',
    //             key: 'Text-596dc8ed7ca64',
    //             label: 'Text3',
    //             level: 'Text',
    //             role: 'Период отчета',
    //             contextMenu: true
    //           }
    //         ]
    //       }
    //     ]
    //   }
    // ]
    // this.expandAll()
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
    saveReport() {
      console.log('saveReport')

      const sheets = this.currentElement.children.map((item) => ({
        label: item.label,
        table: item.excelTableData
      }))

      const workbook = new Excel.Workbook()
      sheets.forEach((sheet) => {
        const worksheet = workbook.addWorksheet(sheet.label)
        let timeColumnIndex = null

        sheet.table.forEach((sheetRow, i) => {
          if (i === 0) {
            worksheet.columns = Object.keys(sheetRow).map((key) => {
              if (key.match('column')) {
                return { header: sheetRow[key], key }
              } else {
                return { header: '', key }
              }
            })
          } else {
            if (Object.keys(sheetRow).some((item) => item.match('column'))) {
              timeColumnIndex = Object.keys(sheetRow).findIndex((el) => {
                return checkTimeRegex.test(sheetRow[el])
              })

              // eslint-disable-next-line no-unused-vars
              const { $id, ...otherFields } = sheetRow
              worksheet.addRow(otherFields)

              const todaysDate = new Date()
              const now = new Date()
              const inputDate = new Date(this.reportData.date)
              const inputDateIsToday =
                inputDate.setHours(0, 0, 0, 0) == todaysDate.setHours(0, 0, 0, 0)

              const countOfReport = Math.floor(
                inputDateIsToday
                  ? (now.getHours() * 60) / this.reportData.period
                  : maxMinutesInDay / this.reportData.period
              )

              for (let index = 0; index < countOfReport; index++) {
                const fields = Object.keys(sheetRow).reduce((acc, sheet, sheetIndex) => {
                  if (sheet === '$id') return acc
                  if (sheetIndex === timeColumnIndex) return acc

                  acc[sheet] = getRandomNumber(10, 100, 1)

                  return acc
                }, {})

                worksheet.addRow(fields)
              }
            }
          }
        })
      })

      workbook.xlsx
        .writeBuffer()
        .then((buffer) =>
          saveAs(
            new Blob([buffer]),
            `${this.currentElement.label}-${this.reportData.date.toISOString()}.xlsx`
          )
        )
        .catch((err) => console.log('Error writing excel export', err))

      this.showGenerateReportModal = false
    },

    expandAll() {
      for (let node of this.nodes) {
        this.expandNode(node)
      }

      this.controlPanelExpandedKeys = { ...this.controlPanelExpandedKeys }
    },

    expandNode(node) {
      if (node.children && node.children.length) {
        this.controlPanelExpandedKeys[node.key] = true

        for (let child of node.children) {
          this.expandNode(child)
        }
      }
    },

    editReportForm() {
      if (this.currentElement.children?.length) {
        this.isExelTableOpen = true
      } else {
        this.setError('Добавьте листы в форму отчёта')
      }
    },

    setError(errorText) {
      this.error = errorText

      setTimeout(() => {
        this.error = null
      }, 2000)
    },

    initExcelTableData() {
      let defaultData = [{}]
      let preData = ['Дата формирования:', currentDate, getCurrentTime()]

      this.columnLetters.forEach((item, i) => {
        if (!preData[i]) {
          defaultData[0]['column' + item] = ''
        } else {
          defaultData[0]['column' + item] = preData[i]
        }
      })

      const otherRecords = new Array(21).fill(1).map((item) => {
        item = {}

        return item
      })

      return [...defaultData, ...otherRecords]
    },

    downloadReportForm() {
      this.loading = true

      setTimeout(() => {
        this.currentElement.isReportFormDownloaded = true
        this.loading = false
      }, 2000)
    },

    saveExcelTable() {
      this.nodes = updateElementById({
        array: this.nodes,
        targetId: this.currentElement.id,
        newData: this.currentElement
      })

      this.isExelTableOpen = false
    },

    setExcelTableData() {
      console.log('setExcelTableData', this.selectedEntity)

      if (!this.selectedEntity) return

      let parentElement = null
      let computedTableData = JSON.parse(
        JSON.stringify(this.currentElement.children[this.selectedSheet.index].excelTableData)
      )

      if (this.selectedEntity.level === 'tagTable') {
        parentElement = this.selectedEntity
      } else {
        parentElement = getParentElementById({
          array: this.nodes,
          targetId: this.selectedEntity.id
        })
      }

      for (let index = 0; index < parentElement.children.length; index++) {
        computedTableData[this.lastFocusedRowIndex][
          'column' + convertDigitToLetter(this.colPos + index)
        ] =
          parentElement.children[index].level === 'AVG'
            ? parentElement.children[index].signalLable
            : parentElement.children[index].level === 'Time'
              ? parentElement.children[index].timestamp
              : ''
      }

      this.currentElement.children[this.selectedSheet.index].excelTableData = computedTableData
      this.selectingTableDisplayValues = false
    },

    selectFromSelectingTableDisplayValues(node) {
      console.log('selectFromSelectingTableDisplayValues', node)

      this.selectedEntity = node
    },

    unselectSelectedEntity(node) {
      console.log('unselectSelectedEntity', node)

      this.selectedEntity = null
    },

    showReportFormTree() {
      console.log('showReportFormTree')

      this.selectingTableDisplayValues = true
    },

    cellFocus({ cell, rowPos, colPos }) {
      console.log('cellFocus', cell, rowPos, colPos)
      this.rowPos = rowPos
      this.colPos = colPos

      this.lastFocusedCellId = cell.id
      this.lastFocusedСolumnName = this.getColumnLetter(colPos)
      this.lastFocusedRowIndex = rowPos
      this.isFocused = true
    },

    getColumnLetter(columnPosition) {
      return this.columnLetters[columnPosition]
    },

    cellBlur() {
      setTimeout(() => {
        this.isFocused = null
      }, 290)
    },

    computedColumnWIdth(columnLetter) {
      switch (columnLetter) {
        case 'A':
          return '160px'
        case 'B':
          return '160px'
        case 'C':
          return '160px'
        default:
          return '80px'
      }
    },

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

    generateReport() {
      console.log('generateReport')
      this.showGenerateReportModal = true
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
        case 'AVG':
        case 'Time':
        case 'Text':
          this.$refs.ColumnContextMenu.show(event)
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
  padding-left: 25px;
  padding-right: 25px;
  justify-content: space-between !important;
}

.signalAssignmentPanel-modal .v-card-actions {
  margin-bottom: -52px;
  justify-content: flex-end;
}

.col-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  align-items: center;
  justify-content: space-between;
}
</style>
