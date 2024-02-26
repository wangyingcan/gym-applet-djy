import Toast from '@vant/weapp/toast/toast';
const loginCacheKey = "loginInfo"
Page({
  data: {
    // 每分钟整秒的定时器
    timer: null,
    // 弹出层是否显示
    show: false,
  },

  async onLoad(options) {
    // 0.判断是否需要展示广告
    let show = await this.initShow();
    console.log("show:", show);

    // 1.获取屏幕宽度和汇率
    let app = getApp();
    let windowWidth = app.globalData.windowWidth;
    let exchangeRate = app.globalData.exchangeRate;
    await this.setData({
      exchangeRate,
      show
    })
    console.log(windowWidth, exchangeRate);
  },

  async initShow() {
    // 0.1获取用户是否注册的isNewUser
    let isNewUser = false;
    await wx.cloud.callFunction({
      name: 'isNewUser'
    }).then(res => {
      console.log("isNewUser:", res.result.isNewUser);
      isNewUser = res.result.isNewUser;
    }).catch(err => {
      console.log("isNewUser:", err);
    })

    if (!isNewUser) {
      // 0.2获取用户是否办卡
      let isBuyCard = false;
      await wx.cloud.callFunction({
        name:'isBuyCard'
      }).then(res => {
        console.log("isBuyCard:", res.result.isBuyCard);
        isBuyCard = res.result.isBuyCard;
      }).catch(err => {
        console.log("isBuyCard:", err);
      })

      if(isBuyCard) {
        // 已注册用户  &&  买过卡  hide   !!!!!!!
        return false;
      }else{
        // 已注册用户  &&  未买过卡  
        // 0.3获取用户是否有新用户优惠券
        let hasNewUserToken = false;
        await wx.cloud.callFunction({
          name:'hasNewUserToken'
        }).then(res => {
          console.log("hasNewUserToken:", res.result.hasNewUserToken);
          hasNewUserToken = res.result.hasNewUserToken;
        }).catch(err => {
          console.log("hasNewUserToken:", err);
        })

        if(!hasNewUserToken) {
          // 已注册用户  &&  未买过卡  &&  无新用户优惠券  show   !!!!!!!
          return true;
        }else{
          return false;
        }
      }
    } else {
      // 未注册用户，show   !!!!!!!
      return true;
    }
  },

  onShow() {
    let that = this;
    // 1. 计算当前和下一分钟整秒的时间差
    that.checkTime();
    const nowSeconds = new Date().getSeconds();
    const delay = (60 - nowSeconds) * 1000;
    // 2. 执行一次的setTimeout，设置timer保证之后定时器是每分钟整秒执行
    setTimeout(() => {
      that.checkTime();
      that.setData({
        timer: setInterval(() => {
          that.checkTime();
        }, 60 * 1000)
      })
    }, delay)
  },

  onHide() {
    // 清除定时器
    clearInterval(this.data.timer);
  },

  // 检查是否到了更新时间
  checkTime() {
    let now = new Date();
    let start1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 0, 0, 0);
    let end1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 22, 1, 0, 0);
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
    console.log("是否在此处就set了登录缓存");
    const data = wx.getStorageSync(loginCacheKey)
    console.log("data:", data);
    if (data) {

      // 之后将下面的逻辑转换给支付按钮点击，然后此处修改成跳转支付页面
      wx.navigateTo({
        url: '/pages/buyWeeklyCards/index',
      })

    } else {
      // 1.2.未登录
      Toast({
        message: '请登录',
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
        message: '请登录',
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
    wx.navigateTo({
      url: "/pages/newUserToken/index",
    })
    // Toast({
    //   message:'暂未开放，敬请期待',
    //   selector: '#van-toast-index'
    // });
  },

  // 1.6.双人成团view点击
  onDoubleGroupClick(e) {
    console.log("onDoubleGroupClick");
    // wx.navigateTo({
    //   url: "/pages/index/index",
    // })
    Toast({
      message: '暂未开放，敬请期待',
      selector: '#van-toast-index'
    });
  },

  redireactToAdministrator(e) {
    wx.navigateTo({
      url: '/pages/administrator/index',
    })
  },

  // 弹出层测试
  showPopup() {
    this.setData({ show: true });
  },

  onClose() {
    this.setData({ show: false });
  },

  // 点击广告按钮跳转
  redireactToNewUserToken(e) {
    wx.navigateTo({
      url: '/pages/newUserToken/index',
    })
    this.onClose();
  }
})