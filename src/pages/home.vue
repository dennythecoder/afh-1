<template>
	<div class="home">
		<h3></h3>
		<h1>Air Force Handbook 1 </h1>
        <div class="btn-container" >
        <list-button @click="$router.push('toc')" >Chapters</list-button>
        <list-button @click="$router.push('searcher')">Search</list-button>
        <list-button v-if="hasLastViewed" @click="gotoLastViewed">Continue Reading</list-button>
        <list-button v-if="hasBookmarks" @click="$router.push('bookmarks')">Bookmarks</list-button>
        <list-button v-if="hasHighlights" @click="gotoHighlights">Highlights</list-button>
        </div>	
	</div>
</template>

<script>
import ListButton from "../components/list-button";
import { mapGetters } from "vuex";
export default {
  components: {
    ListButton
  },
  methods: {
    gotoLastViewed() {
      const lastLocation = localStorage.getItem("lastLocation");
      if (lastLocation) {
        const parsed = JSON.parse(lastLocation);
        window.location.hash = "#/reader/" + parsed.location;
      }
    }
  },
  computed: {
    ...mapGetters(["bookmarks"]),
    hasLastViewed() {
      let lastLocation = localStorage.getItem("lastLocation");
      return lastLocation && true;
    },
    hasBookmarks() {
      return this.$store.getters.bookmarks.length > 0;
    },
    hasHighlights() {
      return this.$store.getters.highlights.length > 0;
    }
  },
  created() {
    if (this.bookmarks.length === 0) {
      this.$store.commit("initBookmarks");
    }
  }
};
</script>

<style>
.home h3 {
  background-image: url("../assets/af_logo.svg");
  background-size: 25vw 25vw;
  background-repeat: no-repeat;
  height: 25vw;
  background-position: center;
}

.home {
  background-color: white;
  text-align: center;
  position: absolute;
  top: 0;
  height: 140%;
  width: 100%;
  z-index: 4003;
}
</style>