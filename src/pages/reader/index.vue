
<script>
import init from "./init";
import highlights from "./highlights";
import watch from "./watch";

export default {
  data() {
    return {
      book: undefined,
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
    },
    isInitialized() {
      return this.book !== undefined;
    },
    readerStyle() {
      if (this.isInitialized && this.$route.name !== "reader") {
        console.log(true);
        return {
          position: "absolute",
          top: 0,
          zIndex: -1
        };
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
    },
    gotoCfi(cfi) {
      // expecting string like this -- epubcfi(/6/2[titlepage]!/4/1:0)
      return this.book.gotoCfi(cfi.replace(/-/g, "/"));
    },
    highlightText(text) {
      if (!text) return;
      let doc = document.querySelector("iframe").contentDocument;
      let paragraphs = doc.querySelectorAll("p");
      const searchRegExp = new RegExp(text.toLocaleLowerCase(), "ig");
      for (let i = 0; i < paragraphs.length; i++) {
        let paragraph = paragraphs[i];
        paragraph.innerHTML = paragraph.innerHTML.replace(
          searchRegExp,
          result => "<mark class='highlight search'>" + result + "</mark>"
        );
      }
    },
    clearHighlights() {
      let doc = document.querySelector("iframe").contentDocument;
      let highlights = doc.querySelectorAll("mark.highlight.search");
      for (let i = 0; i < highlights.length; i++) {
        highlights[i].outerHTML = highlights[i].innerHTML;
      }
    }
  },
  watch,
  mounted() {
    this.$nextTick(() => this.init());
  }
};
</script>

<template>

  <q-page id="reader" :style="readerStyle">
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
