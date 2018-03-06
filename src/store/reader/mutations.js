import Vue from "vue";

function getChapterName(href, chapters) {
  for (let i = 0; i < chapters.length; i += 1) {
    if (chapters[i].href === href) {
      return chapters[i].label;
    }
  }
  return "";
}

export default {
  addChapter(state, chapter) {
    state.chapters.push(chapter);
  },

  searchPages(state, searchTerm) {
    state.searchTerm = searchTerm;
  },

  setBook(state, book) {
    state.book = book;
    state.isBookInitialized = true;
  },
  createHighlight(state, highlight) {
    this.commit("saveLastLocation");
    highlight.location = state.lastLocation;
    state.highlights.push(highlight);
    localStorage.setItem("highlights", JSON.stringify(state.highlights));
  },
  destroyHighlight(state, highlight) {
    for (let i = 0; i < state.highlights.length; i += 1) {
      if (state.highlights[i].guid === highlight.guid) {
        state.highlights[i].start = state.highlights[i].endLocation.start;
        state.highlights[i].end = state.highlights[i].endLocation.end;
        state.destroyedHighlights.push(state.highlights[i]);
        state.highlights.splice(i, 1);
        localStorage.setItem("highlights", JSON.stringify(state.highlights));
      }
    }
  },
  gotoCfi({ commit, state }, cfi) {
    // expecting string like this -- epubcfi(/6/2[titlepage]!/4/1:0)
    if (!state.book.gotoCfi) return new Promise();

    return state.book.gotoCfi(cfi).then(() => {
      commit("saveLastLocation");
    });
  },

  toggleIsTextSelectable(state) {
    state.isTextSelectable = !state.isTextSelectable;
  },
  saveLastLocation(state) {
    
    const cfi = state.book.getCurrentLocationCfi();
    let result = /epubcfi\((.*)\)/.exec(cfi);
    let location = result[1].replace(/\//g, "-");
    let href = state.book.currentChapter.href;
    let chapterName = getChapterName(href, state.chapters);
    let lastLocation = {
      location: location,
      href: href,
      chapterName: chapterName
    };

    const json = JSON.stringify(lastLocation);
    localStorage.setItem("lastLocation", json);
    Vue.set(state, "lastLocation", lastLocation);
  },
  setIsTextSelectable(state, val) {
    state.isTextSelectable = val;
  },

  setHighlightColor(state, color) {
    state.highlightColor = color;
  },
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
};
