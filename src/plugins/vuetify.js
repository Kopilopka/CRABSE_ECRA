// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as labsComponents from 'vuetify/labs/components'
import { VDateInput } from 'vuetify/labs/VDateInput'

export default createVuetify({
  components: {
    ...components,
    ...labsComponents,
    VDateInput
  },

  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  }
  // https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
})
