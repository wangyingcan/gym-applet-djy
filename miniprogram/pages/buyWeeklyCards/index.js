// pages/buyWeeklyCards/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  onClick3(){
    console.log("onClick3");
    // 跳转到一周三练的下单页面
    wx.navigateTo({
      url: '/pages/buyWeeklyCard3/index',
    })
  },

  onClick4(){
    console.log("onClick4");
    // 跳转到一周四练的下单页面
    wx.navigateTo({
      url: '/pages/buyWeeklyCard4/index',
    })
  },

  onClick5(){
    console.log("onClick5");
    // 跳转到一周五练的下单页面
    wx.navigateTo({
      url: '/pages/buyWeeklyCard5/index',
    })
  }
})