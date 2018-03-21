import Vue from "vue";
import Vuex from "vuex";
import router from "../router";
import reader from "./reader";
import pages from "./pages";
import searcher from "./searcher";

const localStorage = window.localStorage || {getItem(){},setItem(){}};

Vue.use(Vuex);

const vuexStore = new Vuex.Store({
  state: {
    router,
    ...reader.state,
    ...pages.state,
    ...searcher.state
  },
  getters:{
    ...reader.getters,
    ...pages.getters,
    ...searcher.getters
  },
  mutations:{
    ...reader.mutations,
    ...pages.mutations,
    ...searcher.mutations
  },
  actions: {
    ...reader.actions,
    ...pages.actions,
    ...searcher.actions
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
  window.store = store;
  return store;
}

init(vuexStore);
export default vuexStore;
