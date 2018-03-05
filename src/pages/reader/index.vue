
<script>
import init from "./init";
import highlights from "./highlights";

export default {
  data() {
    return {
      book: {},
      isTextSelectable: false
    };
  },
  computed: {
    styleObj() {
      if (this.$route.name !== "reader") {
        return {
          "background-color": "white"
        };
      } else {
        return {};
      }
    }
  },
  methods: {
    ...init,
    ...highlights,
    onSwipe(e) {
      if (e.direction === "right") {
        this.book.prevPage();
      } else if (e.direction === "left") {
        this.book.nextPage();
      }
    },
    onHold(e) {
      this.isTextSelectable = true;
    }
  },

  mounted() {
    this.$nextTick(() => this.init());
  }
};
</script>

<template>

  <q-page id="reader">
      <div id="content-overlay" v-touch-swipe="onSwipe" v-touch-hold="onHold" v-if="!isTextSelectable" :style="styleObj"></div>
      <div id="content" ref="content" ></div>
  </q-page>

</template>

<style>
#content {
  height: 100%;
  width: 100%;
  min-height: 100%;
}
#content div {
  height: 100%;
}
#content-overlay {
  position: absolute;
  margin: 0 0;
  height: 100vh;
  width: 100vw;
}

#reader {
  height: 100% !important;
}
.q-layout-page-container {
  height: 100vh;
}
</style>
