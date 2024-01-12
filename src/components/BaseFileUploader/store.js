/**
 * @author 徐鹏飞
 * @desc 图片上传对应的vuex
 */
import Vue from 'vue'

const state = {
  files: {}
}
const getters = {
  files: (state) => state.files,
  completed: (state) => {
    for (let uuid in state.files) {
      if (state.files[uuid].status !== 'completed') {
        return false
      }
    }
    return true
  }
}
const mutations = {
  ADD_FILES(state, dict) {
    for (let k in dict) {
      Vue.set(state.files, k, dict[k])
    }
  },
  UPDATE_PROGRESS(state, { uuid, progress }) {
    state.files[uuid].progress = progress
  },
  UPLOAD_COMPLETE(state, { uuid }) {
    let item = state.files[uuid]
    Vue.set(item, 'status', 'completed')
  },
  UPLOAD_FAIL(state, { uuid }) {
    let item = state.files[uuid]
    Vue.set(item, 'status', 'fail')
  },
  CLEAN(state) {
    for (let uuid in state.files) {
      Vue.delete(state.files, uuid)
    }
  },
  DEL(state, id) {
    Vue.delete(state.files, id)
  },
  INIT(state) {
    for (let uuid in state.files) {
      let item = state.files[uuid]
      if (item.status !== 'running') {
        delete state.files[uuid]
      }
    }
  }
}
const actions = {
  add({ commit }, files) {
    commit('ADD_FILES', files)
  },
  run({ commit, state }, uuid) {
    return new Promise((resolve, reject) => {
      let item = state.files[uuid]
      if (item.status !== 'waiting') {
        resolve(1)
        return
      }
      item.status = 'running'
      if (item.file.size > 1024 * 1024 * 10) {
        // 大于10m分片上传
        /**
         * @typedef {object} IUploadItem
         * @property {() => Promise<void>} api
         * @property {File} file
         * @property {object} form
         * @property {number} id
         * @property {string} name
         * @property {string} path
         * @property {number} progress
         * @property {number} size
         * @property {'running' | 'waiting' | 'completed' | 'fail'} status
         * */
          // 分片大小
        const cutSize = 1024 * 1024 * 2
        // 总分片数量
        const totalCutNum = Math.ceil(item.file.size / cutSize)
        item.form.total_blob_num = totalCutNum
        item.form.file_flag = ''
        item.form.file_name = item.file.name
        /**
         * @param {IUploadItem} item
         * @param {number} startSize 当前开始分割位置
         * @param {number} index 当前分片编号
         * */
        const pieces = (item, startSize, index) => {
          let endSize = startSize + cutSize
          if (endSize > item.file.size) {
            endSize = item.file.size
          }
          const progress = Math.floor(Number((index / totalCutNum).toFixed(2)) * 100)
          let chunk = item.file.slice(startSize, endSize, item.file.type)
          item.form.file_upload = chunk
          item.form.blob_num = index
          item
            .api(item.form, (evt) => {
              /*if (evt.lengthComputable) {
                const percentComplete = Math.round((evt.loaded * 100) / evt.total)
                commit('UPDATE_PROGRESS', { uuid: uuid, progress: percentComplete })
              } else {
                console.warn('upload progress unable to compute')
              }*/
            })
            .then((res) => {
              if (res.data.is_finish) {
                // 传完了
                commit('UPLOAD_COMPLETE', { uuid: uuid })
                resolve(res)
              } else {
                item.form.file_flag = res.data.file_flag
                // 没传完，更新进度
                Vue.set(item, 'progress', progress)
                pieces(item, endSize, index + 1)
              }
            })
            .catch((err) => {
              commit('UPLOAD_FAIL', { uuid: uuid })
              resolve(2)
            })
        }

        pieces(item, 0, 1)
      } else {
        // 无需分片
        item
          .api(item.form, (evt) => {
            if (evt.lengthComputable) {
              const percentComplete = Math.round((evt.loaded * 100) / evt.total)
              commit('UPDATE_PROGRESS', { uuid: uuid, progress: percentComplete })
            } else {
              console.warn('upload progress unable to compute')
            }
          })
          .then((res) => {
            commit('UPLOAD_COMPLETE', { uuid: uuid })
            resolve(res)
          })
          .catch((err) => {
            commit('UPLOAD_FAIL', { uuid: uuid })
            resolve(2)
          })
      }
    })
  },
  runAll({ commit, dispatch, state }) {
    return new Promise((resolve, reject) => {
      let arr = []
      for (let uuid in state.files) {
        let item = dispatch('run', uuid)
        arr.push(item)
      }
      if (arr.length === 0) {
        reject(new Error('无任务'))
      } else {
        Promise.all(arr).then((res) => {
          resolve(res)
        })
      }
    })
  },
  progress({ commit }, { uuid, progress }) {
    commit('UPDATE_PROGRESS', { uuid, progress })
  },
  complete({ commit }, { uuid }) {
    commit('UPLOAD_COMPLETE', { uuid })
  },
  fail({ commit }, { uuid }) {
    commit('UPLOAD_FAIL', { uuid })
  },
  clean({ commit }) {
    commit('CLEAN')
  },
  init({ commit }) {
    commit('INIT')
  }
}
export default { state, getters, mutations, actions, namespaced: true }
