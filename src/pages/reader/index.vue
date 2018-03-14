
<script>
import init from "./init";
import CreateHighlightManager from "../../highlight";
import watch from "./watch";
import HighlightButton from "../../components/highlight-button";

export default {
  components: {
    HighlightButton
  },
  data() {
    return {
      book: undefined,
      isTextSelectable: false
    };
  },
  computed: {

    isInitialized() {
      return this.book !== undefined;
    },
    readerStyle() {
      if (this.isInitialized && this.$route.name !== "reader") {
        return {
          position: "absolute",
          top: 0,
          zIndex: -2
        };
      }
    }
  },
  methods: {
    ...init,

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
    markHighlights() {
      const hm = CreateHighlightManager(this.$store);
      hm.markHighlights();
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
    <div id="content-overlay" v-if="$route.name !== 'reader'" ></div>
    <div id="content" ref="content" ></div>

      <highlight-button v-show="isTextSelectable"/>
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
