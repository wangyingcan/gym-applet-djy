// pages/canceledCourseDetail/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //canceledCourseNum预约课程数，onload执行完再获取，为零显示空状态
    canceledCourseList: [],//预约课程列表
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

  // 刷新页面函数
  async refresh() {
    console.log("refresh");
    // 1.获取最新取消课程数量、取消课程列表
    const { result: { canceledCourseList, canceledCourseNum } } = await wx.cloud.callFunction({
      name: 'getCanceledCourseList'
    })

    console.log('canceledCourseList:', canceledCourseList);
    console.log('canceledCourseNum:', canceledCourseNum);

    // 2.修改canceledCourseList中的cancelTime属性（2024.2.16 14:8:52形式）
    for( let canceledCourse of canceledCourseList){
      // 2.1获取空格之后的时间
      const timeStr = canceledCourse.cancelTime.split(' ')[1];
      // 2.2获取小时、分钟、秒
      let hourStr= timeStr.split(':')[0];
      let minuteStr= timeStr.split(':')[1];
      let secondStr= timeStr.split(':')[2];
      // 2.3判断长度进行设计者
      if(hourStr.length==1){
        hourStr='0'+hourStr;
      }
      if(minuteStr.length==1){
        minuteStr='0'+minuteStr;
      }
      if(secondStr.length==1){
        secondStr='0'+secondStr;
      }
      // 2.4设置cancelTime属性
      canceledCourse.cancelTime = canceledCourse.cancelTime.split(' ')[0]+' '+hourStr+':'+minuteStr+':'+secondStr;
    }

    // 3.设置数据
    await this.setData({
      canceledCourseNum,
      canceledCourseList
    })
  },

  // 一级菜单项点击事件
  onClickPowerInfo(e) {
    console.log('onClickPowerInfo');
    const index = e.currentTarget.dataset.index;
    const canceledCourseList = this.data.canceledCourseList;
    const selectedItem = canceledCourseList[index];
    selectedItem.showItem = !selectedItem.showItem;
    this.setData({
      canceledCourseList
    });
  },
})