// miniprogram/components/cloudTipModal/index.js
// 0.引入envList.js中的isMac常量，用于决定tipText的渲染文本内容
const { isMac } = require('../../envList.js');

// 1.利用Component({});自定义组件
Component({

  /**
   * 页面的初始数据
   */
  data: {
    // 1.1 showUploadTip来源自父页面传入属性，isMac来源自引入
    showUploadTip: false,
    tipText: isMac ? 'sh ./uploadCloudFunction.sh' : './uploadCloudFunction.bat'
  },
  // 1.2 定义组件的属性，接收父页面的参数
  properties: {
    showUploadTipProps: Boolean
  },
  // 1.3 组件的观察者，监听showUploadTipProps的变化
  observers: {
    showUploadTipProps: function(showUploadTipProps) {
      this.setData({
        showUploadTip: showUploadTipProps
      });
    }
  },
  // 1.4 定义组件的方法
  methods: {
    // 1.4.1 切换showUploadTip的值，控制组件的显示隐藏
    onChangeShowUploadTip() {
      this.setData({
        showUploadTip: !this.data.showUploadTip
      });
    },
    // 1.4.2 "复制" shell命令到剪切板
    copyShell() {
      wx.setClipboardData({
        data: this.data.tipText,
      });
    },
  }

});
