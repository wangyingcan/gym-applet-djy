// app.js
const {envList} =require('./envList')
App({
  onLaunch: function () {
    // 登录用户信息缓存
    const loginCacheKey = "loginInfo"
    wx.removeStorageSync(loginCacheKey)
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        env:envList[1].envId,
        traceUser: true,
      });
    }

    const { windowWidth } = wx.getSystemInfoSync()
    const exchangeRate = 375/windowWidth;

    this.globalData = {windowWidth,exchangeRate};

    wx.getSystemInfo({
      success: e => {
        this.globalData.StatusBar = e.statusBarHeight;
        let custom = wx.getMenuButtonBoundingClientRect();
        this.globalData.Custom = custom;  
        // this.globalData.CustomBar = custom.bottom + custom.top - e.statusBarHeight;
        // this.globalData.CustomBar = 60*this.globalData.exchangeRate;
        this.globalData.CustomBar = 60;
      }
    })
  },
});
