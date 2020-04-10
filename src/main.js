import Vue from 'vue'
import App from './App.vue'
import Swoosh from './'

Vue.use(Swoosh)

import './style/main.styl'

Vue.config.productionTip = false

new Vue({
	render: h => h(App),
}).$mount('#app')
