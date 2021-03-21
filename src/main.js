import Vue from 'vue'
import App from './App'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import Vuex from 'vuex'
Vue.use(Vuex)
const store = new Vuex.Store({})

import BaseFileUploader from '@/components/BaseFileUploader'
Vue.use(BaseFileUploader, store)
Vue.use(ElementUI, {
  size: 'small'
})
new Vue({
  store,
  el: '#app',
  render: (h) => h(App)
})
