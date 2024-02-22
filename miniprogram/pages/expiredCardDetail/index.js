// pages/expiredCardDetail/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //expireCardNum过期卡数，onload执行完再获取，为零显示空状态
    expiredCardList: [],//过期卡列表
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
    console.log("onPullDownRefresh");
    this.refresh();
  },

  // 刷新页面函数(获取expiredCardList)
  async refresh(){
    // 1.调用云函数获取
    const { result: { expiredCardList, expiredCardNum } } = await wx.cloud.callFunction({
      name: 'getExpiredCardList'
    })

    console.log('expiredCardList:', expiredCardList);
    console.log('expiredCardNum:', expiredCardNum);

    // 2.设置过期卡列表
    this.setData({
      expiredCardList,
      expiredCardNum
    })
  },

  // 一级菜单项点击事件
  onClickPowerInfo(e) {
    console.log('onClickPowerInfo');
    const index = e.currentTarget.dataset.index;
    const expiredCardList = this.data.expiredCardList;
    const selectedItem = expiredCardList[index][0];
    selectedItem.showItem = !selectedItem.showItem;
    this.setData({
      expiredCardList
    });
  },
})