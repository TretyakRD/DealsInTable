<template>
  <main class="main">
    <div class="m-row">
      <div class="m-period">
        <span class="m-period__ttl">Дата</span>
        <datepicker
          language="ru"
          wrapper-class="m-period__wrapper"
          input-class="m-period__input"
          calendar-class="m-period__calendar"
          monday-first
          full-month-name
          format="dd MMMM yyyy"
          v-model="date.min"
        />
        <div class="m-period__dash"></div>
        <datepicker
          language="ru"
          wrapper-class="m-period__wrapper"
          input-class="m-period__input"
          calendar-class="m-period__calendar"
          monday-first
          full-month-name
          format="dd MMMM yyyy"
          v-model="date.max"
        />
      </div>
      <div class="m-phone">
        <div class="m-phone__ttl">Ответственный</div>
        <input
          type="text"
          class="m-phone__input"
          placeholder="Имя ответственного"
          v-model="subscribersPhone"
        />
      </div>
      <button type="button" class="m-row__submit" @click="loadCalls">
        <div class="m-row__submit-inner">Загрузить задачи</div>
      </button>
      <div class="m-controls">
        <button type="button" class="m-controls__btn m-controls__btn_to-fit" @click="() => this.gridApi && this.gridApi.sizeColumnsToFit()">
          <div class="m-controls__btn-inner">Колонки по ширине</div>
        </button>
        <button type="button" class="m-controls__btn m-controls__btn_reset" @click="resetUserOptions">
          <div class="m-controls__btn-inner">Сбросить настройки</div>
        </button>
      </div>
    </div>
    <ag-grid-vue
      style="width: 100%; height: calc(100vh - 145px);"
      class="ag-theme-balham"
      :gridOptions="callsTable.gridOptions"
      :columnDefs="callsTable.columnDefs"
      :rowData="callsTable.rowData"
      :autoGroupColumnDef="callsTable.autoGroupColumnDef"
      :rowGroupPanelShow="callsTable.rowGroupPanelShow"
      :overlayLoadingTemplate="callsTable.overlayLoadingTemplate"
      :overlayNoRowsTemplate="callsTable.overlayNoRowsTemplate"
      :columnResized="columnChange"
      :displayedColumnsChanged="columnChange"
      :toolPanelSuppressPivotMode="true"
      :localeText="callsTable.localeText"
    />

    <!-- popup -->
    <modal
      name="warning-no-paid-version"
      :classes="['c-modal', 'v--modal', 'error-modal']"
      width="450"
      height="auto"
      :clickToClose="false"
    >
      <h4 class="c-modal__ttl">Внимание!</h4>
      <p class="c-modal__message">В бесплатной версии приложения невозможно отобразить более ста задач за период более недели</p>
      <div class="c-modal__actions">
        <a :href="noPayPopupConfirmLink" target="_blank" class="c-modal__btn c-modal__btn_confirm">Перейти на полную версию</a>
        <button type="button" class="c-modal__btn" @click="$modal.hide('warning-no-paid-version')">Понятно</button>
      </div>
    </modal>
  </main>
</template>

<script>
import {AgGridVue} from 'ag-grid-vue'
import Datepicker from 'vuejs-datepicker'
import Treeselect from '@riophae/vue-treeselect'
import '@riophae/vue-treeselect/dist/vue-treeselect.css'
import VueTimepicker from 'vue2-timepicker'
/* eslint-disable */
import {
  getInitialData, getDateValues, getFormattedDate, getTableData,
  getDomainWithTimer, extractContent, getFormattedTimeFromSeconds, getRawPhone,
  getDateDiffInDays
} from '../helpers'
/* eslint-enable */

let initialData = {}
// ищем в ls сохранённые настройки таблицы
// eslint-disable-next-line
let columnState = localStorage.columnState && JSON.parse(localStorage.columnState)

export default {
  name: 'Main',
  components: {
    AgGridVue, Datepicker, Treeselect, VueTimepicker
  },
  data () {
    return {
      // на данный момент fetching нужен только для загрузки при инициализации
      // в дальнейшем управление идет через методы gridApi
      fetching: true,
      date: getDateValues(),
      subscribersPhone: '',
      operatorPhone: '',
      domain: '',
      durationFilter: {
        type: 'any',
        values: {
          first: {
            HH: '00',
            mm: '00',
            ss: '00'
          },
          second: {
            HH: '00',
            mm: '00',
            ss: '00'
          }
        },
        options: [
          {
            id: 'any',
            label: 'Любая'
          },
          {
            id: 'less',
            label: 'Менее чем'
          },
          {
            id: 'more',
            label: 'Более чем'
          },
          {
            id: 'range',
            label: 'Задать диапазон'
          }
        ]
      },
      callsTable: {
        gridOptions: {
          animateRows: true,
          enableColResize: true,
          groupSuppressBlankHeader: true,
          suppressAggFuncInHeader: true,
          enableSorting: true,
          enableFilter: true,
          rowHeight: 36,
          sortingOrder: ['asc', 'desc'],
          pagination: true,
          paginationAutoPageSize: true
        },
        rowGroupPanelShow: 'always',
        columnDefs: [
          {
            headerName: 'Название',
            field: 'title',
            enableRowGroup: true,
            cellRenderer: params => params.value,
          },
          {
            headerName: 'Описание',
            field: 'type',
            enableRowGroup: true
          },
          {
            headerName: 'Статус',
            field: 'status',
            enableRowGroup: true
          },
          {
            headerName: 'Дедлайн',
            field: 'CALL_START_DATE',
            enableRowGroup: true,
            sort: 'asc',
            valueGetter (params) {
              return params.data && params.data.CALL_START_DATE && getFormattedDate(new Date(params.data.CALL_START_DATE))
            }
          },
          {
            headerName: 'Начало задачи',
            field: 'timeStart',
            enableRowGroup: true,
            type: 'numericColumn',
            valueFormatter: params => params.value && getFormattedTimeFromSeconds(params.value)
          },
          {
            headerName: 'Окончание задачи',
            field: 'timeEnd',
            enableRowGroup: true,
            type: 'numericColumn',
            valueFormatter: params => params.value && getFormattedTimeFromSeconds(params.value)
          },
          {
            headerName: 'Ответственный',
            field: 'responded',
            enableRowGroup: true
          },
          {
            headerName: 'Постановщик',
            field: 'creator',
            enableRowGroup: true
          },
          {
            headerName: 'Проект',
            field: 'project',
            enableRowGroup: true
          },
        ],
        rowData: [],
        overlayLoadingTemplate: '<span class="ag-overlay-loading-center"><span class="ag-loaging">Загрузка задач</span></span>',
        overlayNoRowsTemplate: '<span class="ag-no-results" style="padding: 10px; border: 2px solid #444; background: lightgoldenrodyellow;">По заданным фильтрам задач не найдено</span>',
        autoGroupColumnDef: {
          headerName: 'Группа',
          sort: 'asc'
        },
        localeText: {
          page: 'страница',
          // more: 'daMore',
          to: 'из',
          of: 'всего',
          next: 'след.',
          last: 'пред.',
          first: 'первый',
          previous: 'предыдущий',
          loadingOoo: 'загрузка...',

          // for set filter
          selectAll: 'выбрать всё',
          searchOoo: 'Фильтровать по...',
          // blanks: 'daBlanc',

          // for number filter and text filter
          filterOoo: 'Поиск...',
          applyFilter: 'Применить фильтр...',

          // for number filter
          equals: 'Равняется',
          lessThan: 'Меньше чем',
          greaterThan: 'Больше чем',

          // for text filter
          contains: 'содержит',
          startsWith: 'начинается с',
          endsWith: 'заканчивается на',

          // the header of the default group column
          group: 'Группа',

          // tool panel
          columns: 'Столбцы',
          // rowGroupColumns: 'laPivot Cols',
          rowGroupColumnsEmptyMessage: 'Переместите сюда столбец для группировки',
          // valueColumns: 'laValue Cols',
          // pivotMode: 'laPivot-Mode',
          // groups: 'laGroups',
          // values: 'laValues',
          // pivots: 'laPivots',
          // valueColumnsEmptyMessage: 'la drag cols to aggregate',
          // pivotColumnsEmptyMessage: 'la drag here to pivot',
          // toolPanelButton: 'la tool panel',

          // other
          noRowsToShow: 'Нет данных для отображения',

          // enterprise menu
          pinColumn: 'Закрепить столбец',
          // valueAggregation: 'laValue Agg',
          autosizeThiscolumn: 'Авторазмер этой колонки',
          autosizeAllColumns: 'Авторазмер всех колонок',
          groupBy: 'Группировать по',
          ungroupBy: 'Снять группировку по',
          resetColumns: 'Сбросить',
          expandAll: 'Развернуть все',
          collapseAll: 'Свернуть все',
          toolPanel: 'Панель инструментов',
          export: 'Экспорт',
          csvExport: 'Экспорт в CSV',
          excelExport: 'Экспорт в excel',

          // enterprise menu pinning
          pinLeft: 'Слева',
          pinRight: 'Справа',
          noPin: 'Не прикреплять',

          // enterprise menu aggregation and status panel
          sum: 'Сумм',
          min: 'Мин',
          max: 'Макс',
          none: 'Нет',
          count: 'Подсчет количества',
          average: 'Среднее значение',

          // standard menu
          copy: 'Скопировать',
          copyWithHeaders: 'Скопировать с заголовком',
          ctrlC: 'ctrl + C',
          paste: 'Вставить',
          ctrlV: 'ctrl + C'
        }
      }
    }
  },
  computed: {
    durationFilterFirst () {
      const h = +this.durationFilter.values.first.HH
      const m = +this.durationFilter.values.first.mm
      const s = +this.durationFilter.values.first.ss
      return s + (60 * (m + (60 * h))) - 1
    },
    durationFilterSecond () {
      const h = +this.durationFilter.values.second.HH
      const m = +this.durationFilter.values.second.mm
      const s = +this.durationFilter.values.second.ss
      return s + (60 * (m + (60 * h))) + 1
    },
    'noPayPopupConfirmLink' () {
      const domain = window.BX24.getDomain()
      return `//${domain}/marketplace/detail/itsolution.callsintable/`
    }
  },
  methods: {
    nameComparator (name1, name2) {
      if (!name1 && !name2) return 0
      name1 = extractContent(name1).toLowerCase()
      name2 = extractContent(name2).toLowerCase()
      return name1 > name2 ? 1 : -1
    },
    columnChange () {
      if (this.gridColumnApi) {
        columnState = this.gridColumnApi.getColumnState()
        if (columnState) localStorage.setItem('columnState', JSON.stringify(columnState))
      }
    },
    resetUserOptions () {
      if (this.gridColumnApi) {
        this.gridColumnApi.resetColumnState()
        this.gridColumnApi.resetColumnGroupState()
        const columns = this.gridColumnApi.getAllColumns()
        this.gridColumnApi.autoSizeColumns(columns)
      }
      if (this.gridApi) {
        this.gridApi.destroyFilter()
        this.gridApi.sizeColumnsToFit()
        this.gridApi.setFilterModel({})
      }
    },
    // true = платное, false - бесплатное
    checkVersionOfApp () {
      return !!window._itSol && window.callsInTable._itSol === 'itsolutionru.callsintable'
    },
    async loadCalls () {
      this.gridApi.showLoadingOverlay()
      const isPaidVersion = this.checkVersionOfApp()
      const periodInDays = getDateDiffInDays(new Date(this.date.min), new Date(this.date.max))
      let getCallOptions = {}
      // фильтр по телефону
      if (this.subscribersPhone.length) {
        let subscribersRawPhone = getRawPhone(this.subscribersPhone)
        Object.assign(getCallOptions, {'PHONE_NUMBER': subscribersRawPhone})
      }
      // фильтр по длительности звонка
      if (this.durationFilter.type === 'more' || this.durationFilter.type === 'less') {
        if (this.durationFilterFirst > 0) {
          Object.assign(getCallOptions, {
            [`${this.durationFilter.type === 'more' ? '>' : '<'}CALL_DURATION`]: this.durationFilterFirst
          })
        }
      } else if (this.durationFilter.type === 'range') {
        let min = this.durationFilterFirst
        let max = this.durationFilterSecond
        if (this.durationFilterFirst > this.durationFilterSecond) {
          Object.assign(getCallOptions, {
            '>CALL_DURATION': min
          })
        } else {
          Object.assign(getCallOptions, {
            '>CALL_DURATION': min,
            '<CALL_DURATION': max
          })
        }
      }
      initialData = await getInitialData(this.date, getCallOptions)
      // действуем по-разному в зависимости от того, платная ли у нас версия
      // сколько компаний в выборке и каков выбранный период
      if (isPaidVersion || (periodInDays < 7 || (initialData.calls && initialData.calls.length <= 100))) {
        this.callsTable.rowData = getTableData(initialData, {domain: this.domain})
      } else {
        // если период более месяца и звонков за этот период более 100
        // то открываем попап с сообщением
        this.$modal.show('warning-no-paid-version')
        // и выводим пустую выборку
        this.callsTable.rowData = getTableData(Object.assign(initialData, {calls: []}), {domain: this.domain})
      }
      this.gridApi.hideOverlay()
      if (this.callsTable.rowData.length === 0) this.gridApi.showNoRowsOverlay()
    }
  },
  async created () {
    const isPaidVersion = this.checkVersionOfApp()
    const periodInDays = getDateDiffInDays(new Date(this.date.min), new Date(this.date.max))
    // увеличиваем окно до 10к пикселей по высоте
    const BX = window.BX24
    const width = document.documentElement.offsetWidth
    BX && BX.resizeWindow(width, 10000)
    await getDomainWithTimer()
      .then(domain => { this.domain = domain })
      .catch(error => console.error(error))
    initialData = await getInitialData(this.date)
    // действуем по-разному в зависимости от того, платная ли у нас версия
    // сколько компаний в выборке и каков выбранный период
    if (isPaidVersion || (periodInDays < 7 || (initialData.calls && initialData.calls.length <= 100))) {
      this.callsTable.rowData = getTableData(initialData, {domain: this.domain})
    } else {
      // если период более месяца и звонков за этот период более 100
      // то открываем попап с сообщением
      this.$modal.show('warning-no-paid-version')
      // и выводим пустую выборку
      this.callsTable.rowData = getTableData(Object.assign(initialData, {calls: []}), {domain: this.domain})
    }
    this.fetching = false
    if (this.gridApi && this.gridApi.hideOverlay) this.gridApi.hideOverlay()
  },
  mounted () {
    // делаем так, чтобы строка таблицы была на всю длину
    this.callsTable.gridOptions.onGridReady = params => {
      this.gridApi = params.api
      this.gridColumnApi = params.columnApi
      if (columnState) {
        this.gridColumnApi.setColumnState(columnState)
      } else {
        const columns = this.gridColumnApi.getAllColumns()
        this.gridColumnApi.autoSizeColumns(columns)
        this.callsTable.gridOptions.api.sizeColumnsToFit()
      }
      // initial data инициализируется перед export default в этом компоненте
      if (this.fetching) this.gridApi.showLoadingOverlay()
      if (!this.fetching && this.callsTable.rowData.length === 0) this.gridApi.showNoRowsOverlay()
      if (!this.fetching && this.callsTable.rowData.length > 0) this.gridApi.hideOverlay()
    }
  }
}
</script>

<style lang="stylus">
  @import '../styles/_helpers'
  @import '../styles/_common'
  @import '../styles/_m-period'
  @import '../styles/_m-row'
  @import '../styles/_m-phone'
  @import '../styles/_c-link'
  @import '../styles/_m-duration'
  @import '../styles/_m-controls'
  @import '../styles/_c-modal'
</style>
