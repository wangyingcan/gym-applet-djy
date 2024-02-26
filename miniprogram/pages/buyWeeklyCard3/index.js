import Toast from '@vant/weapp/toast/toast';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    checked: false,
    totalFee: 19800,          // 实付金额（提交框、付款金额）
    totalFeeStr: '198.00',      // 实付金额（字符串、商品卡片实付金额）
    originalTotalFeeStr: '198.00',   // 月卡原价（字符串、商品卡片原价）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  // 用户同意单选框
  onChange(event) {
    this.setData({
      checked: event.detail,
    });
  },


  async onSubmit() {
    console.log('onSubmit')
    // 1.设置商品信息
    const totalFee = 1;     // 一周三练卡实付金额
    const body = '一周三练卡购买测试';     //商品名称信息

    wx.showLoading({
      title: '加载中',
      mask: true
    })

    // 2.调用makeOrderTest获取免鉴权参数
    const paymentRes = await this.getPayment(totalFee, body);

    wx.hideLoading();


    // 3.真正进行支付
    const payRes = await this.wxPay(paymentRes.result.payment)
    console.log("支付结果：", payRes)

    // 4.判断支付是否成功
    // 4.1支付成功
    if (payRes.status === 'success') {
      // 1. 一周三练卡添加逻辑
      let { result } = await wx.cloud.callFunction({
        name: 'addWeeklyCard3'
      })
      console.log("result：", JSON.stringify(result));
      console.log("addSuccess：", result.addSuccess);
      // 1.2根据返回结果，提示响应内容
      if (result.addSuccess) {
        Toast({
          message: '购买成功',
          forbidClick: true,
          selector: '#van-toast-weeklyCard3'
        });
      } else {
        Toast({
          message: '出现了一些意外，请联系管理员',
          forbidClick: true,
          selector: '#van-toast-weeklyCard3'
        });
      }
    } else {
      // 4.2支付失败
      Toast({
        message: '取消支付',
        forbidClick: true,
        duration: 1000,
        selector: '#van-toast-weeklyCard3'
      })
    }
  },

  /**
 * 获取支付免鉴权参数
 * @param {number} totalFee 支付金额, 单位：分
 * @param {string} body 商品名称
*/
  getPayment(totalFee, body) {
    console.log('getPayment')
    return new Promise((resolve, rejects) => {
      // 1.调用支付账单生成和返回的云函数
      wx.cloud.callFunction({
        name: 'makeOrderTest',
        data: {
          totalFee,
          body
        },
        success(res) {
          resolve(res)
        },
        fail(err) {
          resolve(err)
        }
      })
    })
  },

  /**
   * 小程序支付API
   * @param {object} payment 支付免鉴权参数
   */
  wxPay(payment) {
    console.log('wxPay')
    console.log('payment', payment)
    return new Promise((resolve, rejects) => {
      // 弹窗支付（payment代表账单信息）
      wx.requestPayment({
        ...payment,
        success(res) {
          console.log(new Date())
          resolve({
            status: 'success',
            res: res
          })
        },
        fail(err) {
          console.log(new Date())
          resolve({
            status: 'fail',
            res: err
          })
        }
      })
    })
  }
  
})