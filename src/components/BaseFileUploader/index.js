import UploadView from './index.vue'
import uplaodStore from './store'

class Uploader {
  constructor(vm) {
    this._vm = vm
    this._accept = [
      'image/png',
      'image/gif',
      'image/jpeg',
      'image/bmp',
      'audio/mpeg',
      'video/mp4'
    ]
    this._data = {}
    this._name = 'file_upload'
    this._then = null
    this._api = null
    this._limit = 5 * 1024 * 1024
  }
  accept(d) {
    this._accept = d
    return this
  }
  data(d) {
    this._data = d
    return this
  }
  name(d) {
    this._name = d
    return this
  }
  api(d) {
    this._api = d
    return this
  }
  limit(d) {
    this._limit = d
    return this
  }
  then(d) {
    this._then = d
    this._dialog && this._dialog.then(d)
    return this
  }
  show() {
    this._dialog = this._vm
      .$baseDialog(UploadView)
      .data({
        accept: this._accept,
        name: this._name,
        data: this._data,
        api: this._api,
        limit: this._limit
      })
      .className('common-file-uploader')
      .then(this._then)
      .show()
    return this
  }
}

const fileSizeFormat = (limit) => {
  let size = ''
  if (limit < 0.1 * 1024) {
    //小于0.1KB，则转化成B
    size = limit.toFixed(2) + 'B'
  } else if (limit < 0.1 * 1024 * 1024) {
    //小于0.1MB，则转化成KB
    size = (limit / 1024).toFixed(2) + 'KB'
  } else if (limit < 0.1 * 1024 * 1024 * 1024) {
    //小于0.1GB，则转化成MB
    size = (limit / (1024 * 1024)).toFixed(2) + 'MB'
  } else {
    //其他转化成GB
    size = (limit / (1024 * 1024 * 1024)).toFixed(2) + 'GB'
  }

  let sizeStr = size + '' //转成字符串
  let index = sizeStr.indexOf('.') //获取小数点处的索引
  let dou = sizeStr.substr(index + 1, 2) //获取小数点后两位的值
  if (dou === '00') {
    //判断后两位是否为00，如果是则删除00
    return sizeStr.substring(0, index) + sizeStr.substr(index + 3, 2)
  }
  return size
}

function install(Vue, store) {
  if (install.installed) return
  install.installed = true
  Vue.filter('fileSizeFormat', fileSizeFormat)
  if (!store.hasModule('uploader')) {
    store.registerModule('uploader', uplaodStore)
  }
  import('../../lib/directory-upload').then(() => {})
  Vue.prototype.$baseFileUploader = function () {
    return new Uploader(this)
  }
}

Uploader.install = install

export default Uploader
