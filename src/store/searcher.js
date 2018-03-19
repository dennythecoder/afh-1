export default {
  state: {
    searchTerm: ""
  },
  getters: {
    searchTerm: (state) => state.searchTerm,
    searchResults(state, getters) {
      let result = [];
      let searchTerm = state.searchTerm;

      if (searchTerm === "") return result;
      const pages = state.pages;

      for (var i = 0; i < pages.length; i++) {
        let page = pages[i];
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
            shortResult: "..." + page.content.substring(start, end) + "...",
            ...page
          });
        }
      }
      return result;
    }
  },
  mutations: {
    searchPages(state, searchTerm) {
      state.searchTerm = searchTerm;
    }
  }
};
