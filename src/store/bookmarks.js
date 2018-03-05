export default {
  state: {
    bookmarks: []
  },
  getters: {
    bookmarks: (state) => state.bookmarks
  },
  mutations: {
    createBookmark(state) {
      this.commit("saveLastLocation");
      const bookmark = state.lastLocation;
      state.bookmarks.push(bookmark);
      localStorage.setItem("bookmarks", JSON.stringify(state.bookmarks));
    },
    destroyBookmark(state, argBookmark) {
      if (argBookmark) {
        this.commit("destroyBookmarkByArg", argBookmark);
      } else {
        for (let i = 0; i < state.bookmarks.length; i += 1) {
          const bookmark = state.bookmarks[i];
          if (bookmark.location === state.lastLocation.location) {
            state.bookmarks.splice(i, 1);
            localStorage.setItem("bookmarks", JSON.stringify(state.bookmarks));
          }
        }
      }
    },
    destroyBookmarkByArg(state, argBookmark) {
      for (let i = 0; i < state.bookmarks.length; i += 1) {
        const bookmark = state.bookmarks[i];
        if (bookmark === argBookmark) {
          state.bookmarks.splice(i, 1);
          localStorage.setItem("bookmarks", JSON.stringify(state.bookmarks));
        }
      }
    }
  }
};
