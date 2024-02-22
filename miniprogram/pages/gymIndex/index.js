import Toast from '@vant/weapp/toast/toast';
const loginCacheKey = "loginInfo"
Page({
  data: {
    // 每分钟整秒的定时器
    timer: null
  },

  onLoad(options) {
    let app = getApp();
    let windowWidth = app.globalData.windowWidth;
    let exchangeRate = app.globalData.exchangeRate;
    this.setData({
      exchangeRate
    })
    console.log(windowWidth, exchangeRate);
  },

  onShow() {
    let that=this;
    // 1. 计算当前和下一分钟整秒的时间差
    that.checkTime();
    const nowSeconds=new Date().getSeconds();
    const delay=(60-nowSeconds)*1000;
    // 2. 执行一次的setTimeout，设置timer保证之后定时器是每分钟整秒执行
    setTimeout(()=>{
      that.checkTime();
      that.setData({
        timer: setInterval(()=>{
          that.checkTime();
        }, 60*1000)
      })
    },delay)
  },

  onHide() {
    // 清除定时器
    clearInterval(this.data.timer);
  },

  // 检查是否到了更新时间
  checkTime() {
    let now = new Date();
    let start1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 53, 0, 0);
    let end1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 58, 0, 0);
    let start2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    let end2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 1, 0, 0);
    if ((now >= start1 && now <= end1) || (now >= start2 && now <= end2)) {
      this.reloadSystem();
    }
  },

  reloadSystem() {
    Toast.loading({
      message: '系统更新中，请耐心等待2分钟...',
      forbidClick: true,
      loadingType: 'spinner',
      mask: true,
      duration: 90000,
      selector: '#van-toast-index'
    });
  },

  // 1.首页事件响应函数
  // 1.1.周卡按钮点击
  async onWeekCardClick(e) {
    console.log("onWeekCardClick");

    // 1.判断是否登录
    const data = wx.getStorageSync(loginCacheKey)
    if (data) {

      // 之后将下面的逻辑转换给支付按钮点击，然后此处修改成跳转支付页面
      wx.navigateTo({
        url: '/pages/buyWeeklyCards/index',
      })

    } else {
      // 1.2.未登录
      Toast({
        message:'请登录',
        selector: '#van-toast-index'
      });
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/gymMyCardPack/index',
        })
      }, 1000)
    }
  },

  // 1.2.月卡按钮点击
  async onMonthCardClick(e) {
    console.log("onMonthCardClick");
    // 1.判断是否登录
    const data = wx.getStorageSync(loginCacheKey)
    if (data) {
      // 之后将下面的逻辑转换给支付按钮点击，然后此处修改成跳转支付页面
      wx.navigateTo({
        url: '/pages/buyMonthlyCard/index',
      })
    } else {
      // 1.2.未登录
      Toast({
        message:'请登录',
        selector: '#van-toast-index'
      });
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/gymMyCardPack/index',
        })
      }, 1000)
    }
  },

  // 1.3.公告栏view点击
  onNoticeClick(e) {
    console.log("onNoticeClick");
    wx.navigateTo({
      url: "/pages/notice/index",
    })
  },

  // 1.4.店长微信view点击
  onBossWXClick(e) {
    console.log("onBossWXClick");
    wx.navigateTo({
      url: "/pages/bossWX/index",
    })
  },

  // 1.5.邀请新用户view点击
  onInviteNewUserClick(e) {
    console.log("onInviteNewUserClick");
    // wx.navigateTo({
    //   url: "/pages/index/index",
    // })
    Toast({
      message:'暂未开放，敬请期待',
      selector: '#van-toast-index'
    });
  },

  // 1.6.双人成团view点击
  onDoubleGroupClick(e) {
    console.log("onDoubleGroupClick");
    // wx.navigateTo({
    //   url: "/pages/index/index",
    // })
    Toast({
      message:'暂未开放，敬请期待',
      selector: '#van-toast-index'
    });
  },

  redireactToAdministrator(e) {
    wx.navigateTo({
      url: '/pages/administrator/index',
    })
  }
})