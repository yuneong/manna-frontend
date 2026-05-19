import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'

import App from './App.vue'
import router from './router'

dayjs.locale('ko')

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin)

app.mount('#app')
