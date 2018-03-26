<template>
  <q-layout view="lHh Lpr lFf" style="background-color:white">
    <q-layout-header>
      <q-toolbar color="primary" glossy>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
        >
          <q-icon name="menu" />
        </q-btn>

        <q-toolbar-title>
          Air Force Handbook 1
        </q-toolbar-title>

       <toolbar-button color="white" @click="clearSearch" v-if="isReader && $store.getters.searchTerm !== ''">Clear Search</toolbar-button>
        <toolbar-button name="fa-bookmark" color="white" @click="createBookmark" v-if="isReader && !isBookmarked" class="float-right" />
        <toolbar-button name="fa-bookmark" color="black" @click="destroyBookmark" v-if="isReader && isBookmarked" class="float-right" />

      </q-toolbar>
    </q-layout-header>

    <q-layout-drawer
      v-model="leftDrawerOpen"
      content-class="bg-grey-2"
    >
      <q-list
        no-border
        link
        inset-delimiter
      >
        <q-list-header>Essential Links</q-list-header>
        <q-item @click.native="$router.push({name:'home'})">
          <q-item-side icon="school" />
          <q-item-main label="Home" />
        </q-item>
        <q-item @click.native="$router.push({name:'toc'})">
          <q-item-side icon="code" />
          <q-item-main label="Table of Contents"  />
        </q-item>
      </q-list>
    </q-layout-drawer>

    <q-page-container>
      
        <router-view />
        <reader></reader>
    </q-page-container>
  </q-layout>
</template>

<script>
import Reader from "../pages/reader";
import ToolbarButton from "../components/toolbar-button";
export default {
  name: "LayoutDefault",
  data() {
    return {
      leftDrawerOpen: this.$q.platform.desktop
    };
  },
  computed: {
    isReader() {
      return this.$route.name === "reader";
    },
    isBookmarked() {
      const { bookmarks, lastLocation } = this.$store.getters;
      for (let i = 0; i < bookmarks.length; i += 1) {
        if (bookmarks[i].location === lastLocation.location) {
          return true;
        }
      }
      return false;
    }
  },
  methods: {
    createBookmark() {
      this.$store.commit("createBookmark");
    },
    destroyBookmark() {
      this.$store.commit("destroyBookmark");
    },
    clearSearch() {
      this.$store.commit('searchPages', '');
    }
  },
  components: {
    Reader,
    ToolbarButton
  }
};
</script>

<style>

</style>
