// pages/gymIndex/index.js
Page({


  // 1.首页事件响应函数
  // 1.1.周卡按钮点击
  onWeekCardClick(e){
    wx.navigateTo({
      url: '/pages/index/index',
    })
  },

  // 1.2.月卡按钮点击
  onMonthCardClick(e){
    wx.navigateTo({
      url:"/pages/index/index",
    })
  },

  // 1.3.公告栏view点击
  onNoticeClick(e){
    wx.navigateTo({
      url:"/pages/index/index",
    })
  },

  // 1.4.店长微信view点击
  onBossWXClick(e){
    wx.navigateTo({
      url:"/pages/index/index",
    })
  },

  // 1.5.邀请新用户view点击
  onInviteNewUserClick(e){
    wx.navigateTo({
      url:"/pages/index/index",
    })
  },

  // 1.6.双人成团view点击
  onDoubleGroupClick(e){
    wx.navigateTo({
      url:"/pages/index/index",
    })
  },

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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },
})