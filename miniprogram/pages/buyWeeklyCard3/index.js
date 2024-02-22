import Toast from '@vant/weapp/toast/toast';
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

  async onSubmit() {
    let { result } = await wx.cloud.callFunction({
      name: 'addWeeklyCard3'
    })
    console.log("result：", JSON.stringify(result));
    console.log("addSuccess：", result.addSuccess);

    // 1.2根据返回结果，提示响应内容
    if (result.addSuccess) {
      Toast('购买成功');
    } else {
      Toast('购买失败');
    }
  }
  
})