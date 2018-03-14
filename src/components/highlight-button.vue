<template>
  <transition name="fade">
    <div class="highlight-float-button" >
      <q-btn round color="pink" @click="highlight">
        <q-icon name="fa-pencil" />
      </q-btn>
    </div>
  </transition>
</template>
<style>
.highlight-float-button {
  position: absolute;
  bottom: 10px;
  left: 10px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
<script>
import CreateHighlightManager from "../highlight";
import { mapMutations } from "vuex";
export default {
  methods: {
    ...mapMutations(["createHighlight"]),
    highlight() {
      const hm = CreateHighlightManager();
      const selection = hm.highlight();
      this.createHighlight({ ...selection });
      hm.releaseSelection();
    }
  }
};
</script>