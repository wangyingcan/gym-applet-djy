// pages/monthlyCourseDetail/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //thisMonthRescordNum课程数，onload执行完再获取，为零显示空状态
    // thisMonth月份字符串
    thisMonthRescordList: [],//预约课程列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("onLoad");
    this.refresh();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log("onPullDownRefresh")
    this.refresh();
  },

  // 刷新页面函数
  async refresh() {
    console.log("refresh");
    // 0.获取本月的时间
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const thisMonth = year + '.' + month;
    this.setData({
      thisMonth
    })
    // 1.获取最新本月课程数量、课程列表
    wx.cloud.callFunction({
      name: 'getMonthlyRecords'
    }).then(res => {
      console.log('查询成功:', res)
      const { result: { thisMonthRescordList,thisMonthRescordNum } } = res
      this.setData({
        thisMonthRescordList,
        thisMonthRescordNum
      })
    }).catch(err => {
      console.log('查询失败:', err)
    })
  },

  // 一级菜单项点击事件
  onClickPowerInfo(e) {
    console.log('onClickPowerInfo');
    const index = e.currentTarget.dataset.index;
    const thisMonthRescordList = this.data.thisMonthRescordList;
    const selectedItem = thisMonthRescordList[index];
    selectedItem.showItem = !selectedItem.showItem;
    this.setData({
      thisMonthRescordList
    });
  }
})