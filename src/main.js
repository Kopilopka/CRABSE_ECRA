import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import contextmenu from 'v-contextmenu'
import 'v-contextmenu/dist/themes/default.css'
import PrimeVue from 'primevue/config'
import 'primevue/resources/themes/md-light-indigo/theme.css'
import './assets/main.css'

loadFonts()

createApp(App)
  .use(vuetify, { iconfont: 'mdi' })
  .use(contextmenu)
  .use(PrimeVue, {
    // unstyled: true,
    zIndex: {
      modal: 1100, //dialog, sidebar
      overlay: 1000, //dropdown, overlaypanel
      menu: 9999, //overlay menus
      tooltip: 1100 //tooltip
    }
  })
  .mount('#app')
