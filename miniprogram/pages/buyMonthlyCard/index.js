import Toast from '@vant/weapp/toast/toast';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    checked: false,
    totalFee: 10,          // 月卡实付金额（提交框）
    totalFeeStr: '0.10',      // 月卡实付金额（字符串、商品卡片实付金额）
    originalTotalFeeStr: '899.00',   // 月卡原价（字符串、商品卡片原价）
    // usedNewUserToken此次支付是否使用了新用户优惠券
    usedNewUserToken: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.refreshPayInfo();
  },


  // 付钱多刷新一下（onLoad和onShow只需要执行一次）
  onShow() {
    console.log('onShow')
  },

  async refreshPayInfo() {
    console.log('refreshPayInfo')
    // 获取用户是否有未使用的券
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    // 1.是否有新用户优惠券
    let hasNewUserToken = false;
    await wx.cloud.callFunction({
      name: 'hasNewUserToken'
    }).then(res => {
      console.log("hasNewUserToken:", res.result.hasNewUserToken);
      hasNewUserToken = res.result.hasNewUserToken;
    }).catch(err => {
      console.log("hasNewUserToken:", err);
    })

    if (hasNewUserToken) {
      // 有新用户优惠券
      // 2.是否使用过
      let hasUsedNewUserToken = false;
      await wx.cloud.callFunction({
        name: 'hasUsedNewUserToken'
      }).then(res => {
        console.log("hasUsedNewUserToken:", res.result.hasUsedNewUserToken);
        hasUsedNewUserToken = res.result.hasUsedNewUserToken;
      }).catch(err => {
        console.log("hasUsedNewUserToken:", err);
      })

      if (hasUsedNewUserToken) {
        // 使用过（展示原价）

      } else {
        // 未使用过（展示打折价）
        console.log("未使用新用户优惠券:",this.data.totalFee)
        let newTotalFee = this.data.totalFee * 0.9;
        // 未使用过
        await this.setData({
          totalFee: newTotalFee,
          totalFeeStr: (newTotalFee / 100).toFixed(2),
          usedNewUserToken: true
        })
      }
    } else {
      // 没有优惠券（展示原价）
    }

    wx.hideLoading();
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
    const totalFee = this.data.totalFee;     // 月卡实付金额（之后需要换成data里的真实值）
    const body = '月卡购买测试';     //商品名称信息

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
      // 1. 月卡添加逻辑
      let { result } = await wx.cloud.callFunction({
        name: 'addMonthCard'
      })
      console.log("result：", JSON.stringify(result));
      console.log("addSuccess：", result.addSuccess);

      // 1.1如果此次使用了优惠券，将优惠券的isUsed修改成true
      if (this.data.usedNewUserToken) {
        let { result: { updateCouponUsed } } = await wx.cloud.callFunction({
          name: 'useNewUserToken'
        })

        // 1.2根据返回结果，提示响应内容（原价  ||  打折）
        if (result.addSuccess) {
          // 1.2.1 购买成功（原价 || 打折）
          Toast({
            message: '购买成功',
            forbidClick: true,
            selector: '#van-toast-monthlyCard'
          });
          // 1.2.2 打折的特别处理
          if(this.data.usedNewUserToken && updateCouponUsed){
            console.log("1.2.2打折的特别处理")
            // 1.2.2.1 还原初始状态，代表下次购买不再使用优惠券
            this.setData({
              usedNewUserToken: false
            })
  
            // 1.2.2.2 跳转到首页
            wx.switchTab({
              url: '/pages/gymIndex/index',
            })
          }
        } else {
          Toast({
            message: '出现了一些意外，请联系管理员',
            forbidClick: true,
            selector: '#van-toast-monthlyCard'
          });
        }
      }
    } else {
      // 4.2支付失败
      Toast({
        message: '取消支付',
        forbidClick: true,
        duration: 1000,
        selector: '#van-toast-monthlyCard'
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