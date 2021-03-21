## vue 文件上传

### 安装
```js
npm install @xpf0000/vue-file-uploader
```

### 使用
```js
// 引用
import Vue from 'vue'
import BaseFileUploader from '@xpf0000/vue-file-uploader'
Vue.use(BaseFileUploader, store)

// 使用
this.$baseFileUploader()
          .name('image')
          .accept(['*.jpg', '*.png'])
          .data({
            a: 5
          })
          .api((form, progress) => {
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
                resolve(true)
              }, 1000)
              console.log('form: ', form)
            })
          })
          .limit(5 * 1024 * 1024)
          .show()
          .then((res) => {
            console.log('res: ', res)
          })
```
