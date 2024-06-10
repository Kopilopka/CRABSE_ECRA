<template>
  <v-navigation-drawer :width="350">
    <div class="navigation" @contextmenu="(event) => $emit('openMainContextMenu', event)">
      <v-text-field label="Найти"></v-text-field>

      <div v-if="menuNodes.length">
        <Tree
          :value="menuNodes"
          v-model:selectionKeys="localSelectedKey"
          v-model:expandedKeys="localExpandedKeys"
          selectionMode="single"
          @nodeSelect="(event) => $emit('nodeSelect', event)"
          @nodeUnselect="(event) => $emit('nodeUnselect', event)"
        >
          <template #default="{ node }">
            <div
              @contextmenu="(event) => $emit('openTreeContextMenu', event, node)"
              class="custom-full"
            >
              <p style="margin-left: 5px">{{ node.label }}</p>
            </div>
          </template>
        </Tree>
      </div>
      <p v-else>
        Для добавления новых форм отчета и дальнейшего их редактироваия, воспользуйтесь контекстным
        меню
      </p>
    </div>
  </v-navigation-drawer>
</template>

<script>
import Tree from 'primevue/tree'

export default {
  name: 'ControlPanel',

  components: {
    Tree
  },

  props: {
    menuNodes: {
      type: Array,
      default: () => []
    },
    selectedKey: {
      type: Object,
      default: () => {}
    },
    expandedKeys: {
      type: Object,
      default: () => {}
    }
  },

  data() {
    return {
      localSelectedKey: {},
      localExpandedKeys: {}
    }
  },

  mounted() {
    this.localSelectedKey = this.selectedKey
    this.localExpandedKeys = this.expandedKeys
  },

  watch: {
    selectedKey() {
      this.localSelectedKey = this.selectedKey
    },

    localSelectedKey() {
      this.$emit('changeSelectionKeys', this.localSelectedKey)
    }
  }
}
</script>

<style>
.navigation {
  padding: 10px 25px;
  display: grid;
  grid-template-rows: max-content 1fr;
  height: 100vh;
}

.p-contextmenu .p-contextmenu-root-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 5px;
}

.p-contextmenu .p-submenu-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 5px;
}

.p-treenode-children {
  margin-left: 12px;
}

.p-treenode-label {
  width: 100%;
  display: flex;
  align-items: center;
}

.custom-full {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
}
</style>
