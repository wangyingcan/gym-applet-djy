import Toast from '@vant/weapp/toast/toast';


Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  getToast(){
    const toast = Toast.loading({
      duration: 0, // 持续展示 toast
      forbidClick: true,  // 展示过程中不允许其余点击事件
      message:"倒计时",
      selector: '#custom-selector',
    });
    
    let second = 3;
    const timer = setInterval(() => {
      second--;
      if (second) {
        toast.setData({
          message: `倒计时 ${second} 秒`,
        });
      } else {
        clearInterval(timer);
        Toast.clear();
      }
    }, 1000);    
  },

  redirectToAdministrator(){
    wx.navigateTo({
      url: '/pages/administrator/index',
    })
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