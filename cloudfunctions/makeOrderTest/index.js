// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 1. 获取数据库引用
const db = cloud.database()

exports.main = async (event) => {

  // 1. 获取参数
  const wxContent = cloud.getWXContext() // openid等信息
  const openid = wxContent.OPENID
  const appid = wxContent.APPID
  const totalFee = event.totalFee // 支付金额（单位：分）
  const body = event.body // 商品名
  const outTradeNo = createOutTradeNo() // 订单号

  // 2. 获取免鉴权支付参数（真正支付的账单相关信息：买家、卖家、支付信息）
  const payMent = await cloud.cloudPay.unifiedOrder({
    "body": body,       // 商品名称
    "outTradeNo": outTradeNo,     // 订单号
    "spbillCreateIp": "127.0.0.1",      // 用户IP
    "subMchId": "1668193895", // 商户号
    "totalFee": totalFee,       // 支付金额
    "envId": "prod-5g2wkpjaadb1bf82", // 云环境id
    "functionName": "payCallBack" // 支付成功回调云函数
  })

  // 3. 创建订单（第2步结束就可以进行）
  const nowTime = new Date().getTime()
  const orderObj = {
    _openid: openid,
    appid: appid,
    outTradeNo: outTradeNo,
    totalFee: totalFee * 0.01,
    payStatus: '支付中',
    createTime: nowTime,
    updateTime: nowTime,
    deleteTime: null,
  }

  // 4. 添加订单到数据库中（数据库的订单记录）
  await addOrder(orderObj)

  // 5. 返回支付免鉴权参数
  return payMent
}

/** 创建随机的唯一订单号(32位) */
const createOutTradeNo = () => {
  let outTradeNo = new Date().getTime() // 获取当前13位时间戳
  let numStr = '0123456789';
  let randomStr = '';
  for (let i = (32 - 13); i > 0; --i) {
    randomStr += numStr[Math.floor(Math.random() * numStr.length)];
  }
  outTradeNo += randomStr
  return outTradeNo
}

/** 向数据库创建订单 */
const addOrder = async (orderObj) => {
  return await db.collection('order')
    .add({
      data: orderObj
    })
    .then(res => {
      console.log("创建订单成功 =====>", res, orderObj)
    })
    .catch(err => {
      console.log("创建订单异常 =====>", err, orderObj)
    })
}
