<template>
    <q-btn flat @click="$emit('click')">
        <q-icon :name="name" :color="color"></q-icon>
    </q-btn>
</template>
<script>
export default {
  props: {
    name: {
      required: true,
      type: String
    },
    color: {
      required: false,
      default: "primary",
      type: String
    }
  }
};
</script>
