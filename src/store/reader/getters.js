export default {
  chapters: (state) => state.chapters,
  highlights: (state) => state.highlights,
  destroyedHighlights: (state) => state.destroyedHighlights,
  isBookInitialized: (state) => state.isBookInitialized,
  lastLocation: (state) => state.lastLocation,
  highlightColor: (state) => state.highlightColor,
  bookmarks: state=> state.bookmarks,
  isTextSelectable(state) {
    return state.isTextSelectable;
  }
};
