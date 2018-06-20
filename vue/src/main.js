import Vue from 'vue'
import App from './App.vue'
import Head from './Head.vue'
import 'bootstrap'

window.$ = window.jQuery = require('jquery')
window.Popper = 'popper.js'


new Vue({
  el: '#app',
  render: h => h(App)
})
