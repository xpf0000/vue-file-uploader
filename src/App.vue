<template>
  <div id="app">
    <el-button @click="show">显示弹窗</el-button>
  </div>
</template>

<script>
  export default {
    name: 'App',
    mounted() {},
    methods: {
      show() {
        this.$baseFileUploader()
          .accept(['image/*'])
          .then((res) => {
            console.log('res: ', res)
          })
          .name('image')
          .data({
            a: 5
          })
          .api((form, progress) => {
            console.log('form: ', form)
            return new Promise((resolve) => {
              setTimeout(() => {
                progress &&
                  progress({
                    lengthComputable: true,
                    loaded: 20,
                    total: 100
                  })
              }, 200)
              setTimeout(() => {
                progress &&
                  progress({
                    lengthComputable: true,
                    loaded: 50,
                    total: 100
                  })
              }, 1200)
              setTimeout(() => {
                progress &&
                  progress({
                    lengthComputable: true,
                    loaded: 100,
                    total: 100
                  })
              }, 5000)
              setTimeout(() => {
                resolve(true)
              }, 5500)
              console.log('form: ', form)
            })
          })
          .show()
      }
    }
  }
</script>
<style>
  #app {
    height: 100vh;
  }
</style>
