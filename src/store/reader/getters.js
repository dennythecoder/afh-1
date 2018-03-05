export default {
  chapters: (state) => state.chapters,
  highlights: (state) => state.highlights,
  destroyedHighlights: (state) => state.destroyedHighlights,
  isBookInitialized: (state) => state.isBookInitialized,
  lastLocation: (state) => state.lastLocation,
  searchTerm: (state) => state.searchTerm,
  highlightColor: (state) => state.highlightColor,

  isTextSelectable(state) {
    return state.isTextSelectable;
  },
  searchResults(state) {
    const result = [];
    const searchTerm = state.searchTerm;
    if (searchTerm === "") return result;
    for (let i = 0; i < state.pages.length; i += 1) {
      const page = state.pages[i];
      if (
        page &&
        page.content &&
        page.content.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
      ) {
        const index = page.content
          .toLowerCase()
          .indexOf(searchTerm.toLowerCase());
        const buffer = 50;
        const start = index - buffer > 0 ? index - buffer : 0;
        const end =
          index + buffer < page.content.length - 1
            ? index + buffer
            : page.content.length - 1;
        result.push({
          shortResult: `...${page.content.substring(start, end)}...`,
          ...page
        });
      }
    }
    return result;
  }
};
