// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 1.获取user表
const db = cloud.database();
const user = db.collection('user');

// 云函数入口函数
exports.main = async (event, context) => {
  // 1.获取openid
  const openid = cloud.getWXContext().OPENID;
  let isBuyCard = false;    // 初始化返回值

  // 2.查询user表的expireCardIds、monthlyCardIds、annualCardIds
  let userRes = await user.where({
    _openid: openid
  }).field({
    expiredCardIds: true,
    monthlyCardIds: true,
    weeklyCardIds: true
  }).get();

  // 3.取出userRes的数据
  let expiredCardIds = userRes.data[0].expiredCardIds;
  let monthlyCardIds = userRes.data[0].monthlyCardIds;
  let weeklyCardIds = userRes.data[0].weeklyCardIds;

  // 4.如果上面3个数组长度均为0，代表新用户
  if (expiredCardIds.length == 0 && monthlyCardIds.length == 0 && weeklyCardIds.length == 0) {
    isBuyCard = false;
  } else {
    isBuyCard = true;
  }

  // 5.返回结果
  return {
    isBuyCard: isBuyCard
  }
}