<template>
  <div id="app">
    <app-head></app-head>
  </div>
</template>

<script>
import Head from './Head.vue'
export default {

  components:{
      'app-head':Head,
  },


  name: 'app',
  data () {
    return {
    }
  }
}

</script>



<style>
@import '~bootstrap/dist/css/bootstrap.css';
@import url('https://fonts.googleapis.com/css?family=Comfortaa:300,400,700');

body{
  font-family: 'Comfortaa'
}
</style>
