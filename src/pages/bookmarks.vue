<template>
    <div>
        <list-button 					
            v-for="(bookmark, bookmarkIndex) in bookmarks"
            @click="gotoBookmark(bookmark)"
            :key="bookmarkIndex">
            {{bookmark.chapterName | trim}}
        </list-button>
        <h3 v-if="bookmarks.length === 0">No bookmarks found.  Please restart the app.</h3>
    </div>
</template>
<script>
import ListButton from "../components/list-button";
import { mapGetters } from "vuex";

export default {
  components: { ListButton },
  filters: {
    trim: val => val.trim()
  },
  methods: {
    gotoBookmark(bookmark) {
      const cfi = bookmark.location.replace(/\//g, "-");
      this.$router.push({ name: "reader", params: { cfi } });
    }
  },
  computed: {
    ...mapGetters(["bookmarks"])
  }
};
</script>
