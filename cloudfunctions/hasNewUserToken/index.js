// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 1.获取couponNewUser表
const db = cloud.database();
const coupon = db.collection('couponNewUser');

// 云函数入口函数
exports.main = async (event, context) => {
  // 1.获取参数
  const openid = cloud.getWXContext().OPENID;
  let hasNewUserToken = false;    // 初始化返回值

  // 2.查询couponNewUser表
  let couponRes = await coupon.where({
    _openid: openid
  }).get();

  // 3.没有查到记录，代表没有优惠券
  if(couponRes.data.length == 0){
    hasNewUserToken = false;
  }else{
    hasNewUserToken = true;
  }

  // 4.返回结果
  return {
    hasNewUserToken: hasNewUserToken
  }
}