import Vue from "vue";
import Vuex from "vuex";
import router from "../router";
import reader from "./reader";
import pages from "./pages";
import bookmarks from "./bookmarks";
import searcher from "./searcher";

Vue.use(Vuex);

const vuexStore = new Vuex.Store({
  state: {
    router
  },
  modules: {
    reader,
    pages,
    bookmarks,
    searcher
  }
});

function init(store) {
  const jsonBookmarks = localStorage.getItem("bookmarks");
  if (jsonBookmarks) {
    Vue.set(store.state, "bookmarks", JSON.parse(jsonBookmarks));
  }
  const jsonLastLocation = localStorage.getItem("lastLocation");
  if (jsonLastLocation) {
    Vue.set(store.state, "lastLocation", JSON.parse(jsonLastLocation));
  }
  const jsonHighlights = localStorage.getItem("highlights");
  if (jsonHighlights) {
    Vue.set(store.state, "highlights", JSON.parse(jsonHighlights));
  }
  return store;
}

init(vuexStore);
export default vuexStore;
