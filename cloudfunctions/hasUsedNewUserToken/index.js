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
  let hasUsedNewUserToken = false;    // 初始化返回值

  // 2.查询couponNewUser表的isUsed字段
  let couponRes = await coupon.where({
    _openid: openid
  }).field({
    isUsed: true
  }).get();

  // 3.取出isUsed字段
  let isUsed = couponRes.data[0].isUsed;

  // 4.返回结果
  return {
    hasUsedNewUserToken: isUsed
  }
}