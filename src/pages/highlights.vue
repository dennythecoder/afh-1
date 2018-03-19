<template>
    <div>
        <list-button 					
            v-for="(highlight, highlightIndex) in highlights"
            @click="gotoHighlight(highlight)"
            :key="highlightIndex">
            {{highlight.textContent | trim}}
        </list-button>
        <h3 v-if="highlights.length === 0">No highlights found.  Please restart the app.</h3>
    </div>
</template>
<script>
import ListButton from "../components/list-button";
import { mapGetters } from "vuex";

export default {
  components: { ListButton },
  filters: {
    trim: val => {
      const l = val.length;
      return l > 100 ? 
        val.substring(0, 100) + '...':
        val
    }
  },
  methods: {
    gotoHighlight(highlight) {
      const cfi = highlight.location.location.replace(/\//g, "-");
      this.$router.push({ name: "reader", params: { cfi } });
    }
  },
  computed: {
    ...mapGetters(["highlights"])
  }
};
</script>
