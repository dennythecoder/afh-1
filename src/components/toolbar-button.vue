<template>
    <q-btn flat @click="$emit('click')">
        <slot></slot>
        <q-icon v-if="name" :name="name" :color="color"></q-icon>
    </q-btn>
</template>
<script>
export default {
  props: {
    name: String,
    color: {
      required: false,
      default: "primary",
      type: String
    }
  }
};
</script>
