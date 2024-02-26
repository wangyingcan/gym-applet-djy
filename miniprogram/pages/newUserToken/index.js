// pages/newUserToken/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showGoToRegistry: false, // 展示“前去注册”
    showGetCoupon: false, // 展示“立即领券”
    showBuyRightNow: false, // 展示”立即享用“
    showNotNewUser: false, // 展示”不是新用户“
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getUserBaseInfo();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getUserBaseInfo();
  },

  // 获取用户的基本情况，同时设置好data
  async getUserBaseInfo() {
    // 1.是否注册
    let isNewUser = false;
    await wx.cloud.callFunction({
      name: 'isNewUser'
    }).then(res => {
      console.log("isNewUser:", res.result.isNewUser);
      isNewUser = res.result.isNewUser;
    }).catch(err => {
      console.log("isNewUser:", err);
    })

    if (isNewUser) {
      // 未注册     showGoToRegistry   !!!!!!!
      await this.setData({
        showGoToRegistry: true,
        showGetCoupon: false,
        showBuyRightNow: false,
        showNotNewUser: false,
      })
    } else {
      // 2.是否购买了会员卡
      let isBuyCard = false;
      await wx.cloud.callFunction({
        name: 'isBuyCard'
      }).then(res => {
        console.log("isBuyCard:", res.result.isBuyCard);
        isBuyCard = res.result.isBuyCard;
      }).catch(err => {
        console.log("isBuyCard:", err);
      })

      // 3.是否有新用户优惠券
      let hasNewUserToken = false;
      await wx.cloud.callFunction({
        name: 'hasNewUserToken'
      }).then(res => {
        console.log("hasNewUserToken:", res.result.hasNewUserToken);
        hasNewUserToken = res.result.hasNewUserToken;
      }).catch(err => {
        console.log("hasNewUserToken:", err);
      })

      if (!isBuyCard&&!hasNewUserToken) {
        // 已注册用户  &&  没买过卡  &&  无新用户优惠券  showGetCoupon   !!!!!!! 
        await this.setData({
          showGoToRegistry: false,
          showGetCoupon: true,
          showBuyRightNow: false,
          showNotNewUser: false,
        })
      }

      if(!isBuyCard && hasNewUserToken) {
        // 已注册用户  &&  未买过卡  &&  有新用户优惠券  showBuyRightNow   !!!!!!!
        await this.setData({
          showGoToRegistry: false,
          showGetCoupon: false,
          showBuyRightNow: true,
          showNotNewUser: false,
        })
      }
      
      if(isBuyCard && !hasNewUserToken) {
        // 已注册用户  &&  买过卡  &&  无新用户优惠券  showNotNewUser   !!!!!!!
        await this.setData({
          showGoToRegistry: false,
          showGetCoupon: false,
          showBuyRightNow: false,
          showNotNewUser: true,
        })
      }

      if(isBuyCard && hasNewUserToken) {
        // 已注册用户  &&  买过卡  &&  有新用户优惠券
        // 4.是否使用了新用户优惠券
        let hasUsedNewUserToken = false;
        await wx.cloud.callFunction({
          name: 'hasUsedNewUserToken'
        }).then(res => {
          console.log("hasUsedNewUserToken:", res.result.hasUsedNewUserToken);
          hasUsedNewUserToken = res.result.hasUsedNewUserToken;
        }).catch(err => {
          console.log("hasUsedNewUserToken:", err);
        })

        if(hasUsedNewUserToken) {
          // 已注册用户  &&  买过卡  &&  有新用户优惠券  &&  使用了新用户优惠券  showNotNewUser   !!!!!!!
          await this.setData({
            showGoToRegistry: false,
            showGetCoupon: false,
            showBuyRightNow: false,
            showNotNewUser: true,
          })
        }else{
          // 已注册用户  &&  买过卡  &&  有新用户优惠券  &&  未使用新用户优惠券  showBuyRightNow   !!!!!!!
          await this.setData({
            showGoToRegistry: false,
            showGetCoupon: false,
            showBuyRightNow: true,
            showNotNewUser: false,
          })
        }
      }

    }
  },

  // 点击领取优惠券
  async onGetCouponClick(e) {
    console.log("onGetCouponClick");
    wx.showLoading({
      title: '领取中',
    })
    // 1.向couponNewUser数据库插入优惠券记录
    const db = wx.cloud.database();
    const couponNewUser = db.collection('couponNewUser');
    await couponNewUser.add({
      data: {
        isUsed: false,
        couponName: "新用户月卡9折优惠券",
        couponUseTime: "",
        couponDiscount: 0.9,
        couponDesc: "新用户专享，首张月卡9折优惠，永不过期",
      }
    }).then(res => {
      console.log("领取成功：", res);
      wx.hideLoading();
      wx.showToast({
        title: '领取成功',
      })
      // 领取之后转换为立即享用
      this.setData({
        showGetCoupon: false,
        showBuyRightNow: true,
      });
    }).catch(err => {
      console.log("领取失败：", err);
      wx.hideLoading();
      wx.showToast({
        title: '领取失败',
      })
    })
  },

  // 点击前往注册
  onRegisterClick(e) {
    console.log("onRegistryClick");
    wx.switchTab({
      url: '/pages/gymMyCardPack/index',
    })
  },

  // 点击立即享用
  onBuyMonthlyCardCheaperClick(e) {
    console.log("onBuyMonthlyCardCheaperClick");
    wx.navigateTo({
      url: '/pages/buyMonthlyCard/index',
    })
  }

})