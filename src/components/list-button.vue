<script>
export default {};
</script>
<template>
  <q-btn class="block list-button" @click="$emit('click')" big rounded outline color="primary"><slot></slot></q-btn>
</template>
<style>
.list-button {
  width: 90%;
  margin: auto;
  margin-top: 4px;
  margin-bottom: 4px;
}
</style>
