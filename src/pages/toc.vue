<template>
    <div>
        <list-button 					
            v-for="(chapter, chapterIndex) in chapters"
            @click="gotoChapter(chapter)"
            :key="chapterIndex">
            {{chapter.label}}
        </list-button>
        <h3 v-if="chapters.length === 0">No chapters found.  Please restart the app.</h3>
    </div>
</template>
<script>
import ListButton from "../components/list-button";
import { mapGetters } from "vuex";

export default {
  components: { ListButton },
  methods: {
    gotoChapter(chapter) {
      const cfi = chapter.cfi.replace(/\//g, "-");
      this.$router.push({ name: "reader", params: { cfi } });
    }
  },
  computed: {
    ...mapGetters(["chapters"])
  }
};
</script>
