// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event) => {
  console.log("回调返回对象 =====>", event)
	// 判断条件
  if (event.returnCode == 'SUCCESS') {
    if (event.resultCode == 'SUCCESS') {
      // 查询条件
      const whereObj = {
        appid: event.subAppid, // 小程序的APPID
        _openid: event.subOpenid, // 小程序用户的openid
        outTradeNo: event.outTradeNo, // 商户号的订单号
      }
      // 更新对象
      const updateObj = {
        transactionId: event.transactionId, // 微信方的订单号
        totalFee: event.totalFee * 0.01, // 微信方收到的金额
        timeEnd: event.timeEnd, // 支付结束时间
        payStatus: '支付成功',
        updateTime: new Date().getTime()
      }
      // 更新订单
      await updateOrder(whereObj, updateObj)
    }
  }
  // 支付回调的返回协议和入参协议（必须返回此结构体，详见文档）
  return {
    errcode: 0,
    errmsg: event.resultCode
  }
}

/** 更新订单的支付状态 */
const updateOrder = async (whereObj, updateObj) => {
  return await db.collection('order')
    .where(whereObj)
    .update({
      data: updateObj
    })
}
