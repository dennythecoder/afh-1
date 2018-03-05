export default {
  "$route.params.cfi": function(val) {
    if (val) {
      this.gotoCfi("epubcfi(" + val.replace(/-/g, "/") + ")").then(() => {
        this.clearHighlights();
        if (this.$store.getters.searchTerm) {
          this.highlightText(this.$store.getters.searchTerm);
        }
        this.appendHandlers();
      });
      this.markHighlights();
    }
    this.appendHandlers();
  }
};
