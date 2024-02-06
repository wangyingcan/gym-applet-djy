// 0. 定义获取全局app数据的变量，这样可以方便Page获取到app.js中定义的全局变量
const app = getApp();
// 0. 定义that变量，通常在异步回调函数中，this的指向会发生变化，所以在异步回调函数之前，通常会将this赋值给that
let that = null;
Page({
  // 1. options接受跳转页面的URL传入的参数（url、title）
  onLoad(options) {
    that = this;
    // 1.1 设置好webUrl
    if (options.url != null) {
      this.setData({
        webUrl: options.url,
      });
      // 1.2 设置好标题（导航栏标题）
      if (options.title != null) {
        wx.setNavigationBarTitle({
          title: options.title,
        });
      }
    } else {
      // 1.3 如果没有传入url参数，返回上一页
      wx.navigateBack({
        delta: 1,   //指定返回的级数
      });
    }
  },
});
