import Vue from "vue";

export default {
  state: {
    pages: []
  },
  getters: {
    pages: (state) => state.pages
  },
  mutations: {
    setPages: (state, payload) => {
      Vue.set(state, "pages", payload);
    }
  },
  actions: {
    generatePagination({ state, commit }) {
      if (state.pages.length > 0) return;
      const localStoragePages = localStorage.getItem("pages");
      if (localStoragePages) {
        const pages = JSON.parse(localStoragePages);
        commit("setPages", pages);
      } else {
        state.book.generatePagination().then((pages) => {
          commit("setPages", pages);
          localStorage.setItem("pages", JSON.stringify(pages));
        });
      }
    }
  }
};
