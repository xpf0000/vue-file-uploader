<template>
  <div class="yb-file-uploader">
    <el-dropdown class="choose-btn" @command="add">
      <el-button type="primary">
        文件/文件夹
        <i class="el-icon-arrow-down el-icon--right"></i>
      </el-button>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="file">文件</el-dropdown-item>
        <el-dropdown-item command="dir">文件夹</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-row class="files-table-main">
      <div
        :class="
          Object.keys(files).length > 0 ? 'selectDir noboard' : 'selectDir'
        "
        @dragenter="dragenter($event)"
        @drop="enentDrop($event)"
        @dragleave="dragleave($event)"
        @dragover="dragover($event)"
        @click="add"
      >
        <Icons
          v-if="Object.keys(files).length === 0"
          name="file-upload"
          class="icon"
        ></Icons>
        <span v-if="Object.keys(files).length === 0">
          将文件夹拖到此处,或点击选择文件夹
        </span>
      </div>
      <el-table
        v-if="Object.keys(files).length > 0"
        :data="Object.values(files)"
        style="width: 100%"
        @dragenter="dragenter($event)"
        @drop="enentDrop($event)"
        @dragleave="dragleave($event)"
        @dragover="dragover($event)"
      >
        <el-table-column prop="path" label="文件名"></el-table-column>
        <el-table-column :prop="null" label="文件大小">
          <template slot-scope="scope">
            <span>{{ scope.row.size | fileSizeFormat }}</span>
          </template>
        </el-table-column>
        <el-table-column :prop="null" label="上传状态">
          <template slot-scope="scope">
            <span v-if="scope.row.status === 'waiting'" class="waiting">
              等待上传
            </span>
            <el-progress
              v-else-if="scope.row.status === 'running'"
              :text-inside="true"
              :stroke-width="20"
              :percentage="scope.row.progress"
            ></el-progress>
            <span v-else-if="scope.row.status === 'completed'" class="success">
              上传完成
            </span>
            <span v-else-if="scope.row.status === 'fail'" class="fail">
              上传失败
            </span>
            <span v-else-if="scope.row.status === 'limitError'" class="fail">
              文件大小过大
            </span>
          </template>
        </el-table-column>
        <el-table-column width="100px" :prop="null" label="操作">
          <template slot-scope="scope">
            <el-button
              v-if="
                scope.row.status === 'limitError' || scope.row.status === 'fail'
              "
              type="text"
              @click.stop="del(scope.row)"
            >
              删除
            </el-button>
            <el-button
              v-if="scope.row.status === 'fail'"
              type="text"
              @click.stop="retry(scope.row)"
            >
              重试
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-row>
  </div>
</template>
<script>
  /**
   * @author 徐鹏飞
   * @desc 图片选择和上传 和 ./store.js搭配使用
   */
  const uuid = () => {
    return Math.floor(Math.random() * (99999999 - 10000000 + 1) + 10000000)
  }
  import { mapGetters } from 'vuex'
  import Icons from '@xpf0000/vuesvgicon'
  import './icon'
  export default {
    title: '文件上传',
    components: { Icons },
    data() {
      return {
        type: 'file',
        accept: [],
        name: '',
        data: {},
        api: null,
        limit: 5 * 1024 * 1024
      }
    },
    computed: {
      ...mapGetters('uploader', {
        files: 'files',
        completed: 'completed'
      })
    },
    created() {
      this.$store.dispatch('uploader/init')
    },
    methods: {
      del(item) {
        this.$store.commit('uploader/DEL', item.id)
      },
      retry(item) {
        this.$store.dispatch('uploader/run', item.id)
      },
      enentDrop: function (e) {
        e.stopPropagation()
        e.preventDefault()
        let self = this
        let iterateFilesAndDirs = function (filesAndDirs, path) {
          for (let i = 0; i < filesAndDirs.length; i++) {
            if (typeof filesAndDirs[i].getFilesAndDirectories === 'function') {
              let path = filesAndDirs[i].path
              filesAndDirs[i]
                .getFilesAndDirectories()
                .then(function (subFilesAndDirs) {
                  iterateFilesAndDirs(subFilesAndDirs, path)
                })
            } else {
              let files = {}
              let file = filesAndDirs[i]
              if (!self.isContain(file)) {
                let id = uuid()
                const item = self.createItem(file)
                ;(item.path =
                  path === '/' ? file.name : `${path}/${file.name}`),
                  (item.id = id)
                files[id] = item
                self.$store.dispatch('uploader/add', files)
              }
            }
          }
        }
        if ('getFilesAndDirectories' in e.dataTransfer) {
          e.dataTransfer.getFilesAndDirectories().then((filesAndDirs) => {
            iterateFilesAndDirs(filesAndDirs, '/')
          })
        }
      },
      dragleave(e) {
        e.stopPropagation()
        e.preventDefault()
      },
      dragenter(e) {
        e.stopPropagation()
        e.preventDefault()
      },
      dragover(e) {
        e.stopPropagation()
        e.preventDefault()
      },
      createItem(file) {
        let form = JSON.parse(JSON.stringify(this.data))
        form[this.name] = file
        const item = {
          api: this.api,
          name: file.name,
          size: file.size,
          file: file,
          progress: 0,
          form: form,
          status: 'waiting'
        }
        if (item.size > this.limit) {
          item.status = 'limitError'
        }
        return item
      },
      /**
       * 点击按钮选择图片
       */
      add(command) {
        console.log('command: ', command)
        this.type = command
        let input = document.createElement('input') //创建input
        let accept = this.accept.join()
        input.type = 'file'
        input.accept = accept
        input.multiple = true
        if (command === 'dir') {
          input.setAttribute('webkitdirectory', 'true')
        }
        input.addEventListener('change', this.fileChanged)
        input.click()
        this.$store.dispatch('uploader/init')
      },
      /**
       * 图片选择完毕
       */
      fileChanged(e) {
        let files = {}
        const list = e.target.files
        e.target.remove()
        for (let i = 0; i < list.length; i++) {
          let file = list[i]
          if (!this.isContain(file)) {
            let id = uuid()
            const item = this.createItem(file)
            item.path = file.webkitRelativePath || file.name
            item.id = id
            files[id] = item
          }
        }
        // 把选择的文件添加到vuex中
        this.$store.dispatch('uploader/add', files)
      },
      /**
       * 排除重复文件
       * @param file 图片文件
       * @returns {boolean} 是否重复
       */
      isContain(file) {
        for (let uuid in this.files) {
          let item = this.files[uuid]
          if (item.name === file.name && item.size === file.size) {
            return true
          }
        }
        return false
      },
      onSubmit() {
        this.$store.dispatch('uploader/runAll').then((res) => {
          console.log('res: ', res)
          this.callBack && this.callBack(res, false)
        })
      }
    }
  }
</script>
<style lang="scss">
  .yb-file-uploader {
    display: flex;
    flex-direction: column;

    .choose-btn {
      flex-shrink: 0;
      width: 100px;
      margin-bottom: 12px;
    }

    .files-table-main {
      position: relative;
      height: 45vh;
      overflow: auto;

      .selectDir {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: #aaa;
        cursor: pointer;
        border: 2px dashed #ccc;
        box-sizing: border-box;

        &.noboard {
          border: none;
        }

        .icon {
          width: 100px;
          height: 100px;
          margin-bottom: 20px;
        }
      }
    }

    .waiting {
      color: #1890ff;
    }

    .success {
      color: #13ce66;
    }

    .fail {
      color: #ff4d4f;
    }

    .hidden {
      display: none;
    }
  }
</style>
