// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import '../node_modules/ag-grid/dist/styles/ag-grid.css'
import '../node_modules/ag-grid/dist/styles/ag-theme-balham.css'
// modal
import VModal from 'vue-js-modal'
/* eslint-disable */
import 'ag-grid-enterprise/main'
import {LicenseManager} from 'ag-grid-enterprise/main'
/* eslint-enable */
// не удалять! это непонятное нечто - фикс ненужных ворнингов аг-грида на наблюдателей вью
import {PropertyKeys} from 'ag-grid/dist/lib/propertyKeys'
import {ColDefUtil} from 'ag-grid/dist/lib/components/colDefUtil'
PropertyKeys.ALL_PROPERTIES.push('__ob__')
ColDefUtil.ALL_PROPERTIES.push('__ob__')
// /не удалять! это непонятное нечто - фикс ненужных ворнингов аг-грида на наблюдателей вью

LicenseManager.setLicenseKey('Evaluation_License_Valid_Until__16_June_2018__MTUyOTEwMzYwMDAwMA==adbba158d5a9934adfbe7a98950af2a4')

Vue.config.productionTip = false

Vue.use(VModal)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})
