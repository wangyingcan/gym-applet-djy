// pages/testAvatar/index.js
Page({
  showPopup() {
    this.setData({ show: true });
  },

  onClose() {
    this.setData({ show: false });
  },

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: "",//头像
    defaultAvatarUrl: "../../images/defaultBorderAvatar.png",
    canSaveUser: false,
    nickName: '', //昵称
    show: false
  },
  // 选择头像
  onChooseAvatar(e) {
    // 获取临时的头像链接
    const { avatarUrl } = e.detail
    this.setData({
      avatarUrl
    })
    this.observerCanSaveUser();
  },

  //实际只有这个方法用到了
  changeNickeNameInput(e) {
    // 检查是否可以保存用户信息（昵称、头像都指定）
    this.observerCanSaveUser();
  },

  // 昵称输入框 软件盘高度改变
  bindkeyboardheightchange(e) {
    if (this.data.preInputBottom && this.data.inputBottom && this.data.preInputBottom === this.data.inputBottom) {
      return;
    }
    if (!this.data.inputBottom) {
      this.setData({ inputBottom: e.detail.height })
    } else {
      this.setData({
        preInputBottom: this.data.inputBottom,
        inputBottom: e.detail.height
      })
    }
  },

  observerCanSaveUser() {
    if (this.data.nickName && String(this.data.nickName).trim() && this.data.avatarUrl) {
      this.setData({
        canSaveUser: true
      })
    } else {
      this.setData({
        canSaveUser: false
      })
    }
  },

  // 头像、昵称同时输入完后才保存，保存成功再关闭
  handleInputAvatarNameAfter() {
       //使用  wx.uploadFile  方法，把头像上传并保存起来
        
    
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

}
})