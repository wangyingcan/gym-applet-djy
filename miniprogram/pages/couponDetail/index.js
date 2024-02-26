// pages/couponDetail/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 新用户优惠券数量
    newUserCouponNum:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 1.获取用户优惠券信息
    this.getUserCoupon();
  },

  onShow(){
    // 1.获取用户优惠券信息
    this.getUserCoupon();
  },

  // 获取用户优惠券信息
  async getUserCoupon(){
    console.log("getUserCoupon");
    // 1.访问数据库couponNewUser获取用户优惠券列表
    let {result:{newUserCouponList}} = await wx.cloud.callFunction({
      name: 'getNewUserCouponList'
    })
    console.log("newUserCouponList:", newUserCouponList);
    // 2.设置data
    await this.setData({
      newUserCouponList: newUserCouponList,
      newUsercouponNum: newUserCouponList.length
    })
  },

  // 打折购买跳转
  redirectToMonthlyCardCheeper(){
    console.log("redirectToMonthlyCardCheeper");
    wx.navigateTo({
      url: '/pages/buyMonthlyCard/index',
    })
  }
})