// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 0.获取user表、expiredCards表
const db = cloud.database();
const user = db.collection('user');
const expiredCards = db.collection('expiredCards');

// 云函数入口函数
exports.main = async (event, context) => {
  // 1.获取openid
  const openid=cloud.getWXContext().OPENID;
  let expiredCardList = [];

  // 2.查询user表获取expiredCardIds
  let res = await user.where({
    _openid: openid
  }).field({
    expiredCardIds: true
  }).get();

  // 3.判断是否查询成功
  if (res.data.length > 0) {
    // 3.1获取expiredCardIds
    let expiredCardIds = res.data[0].expiredCardIds;
    // 3.2遍历expiredCardIds，获取expiredCardList
    for (let expiredCardId of expiredCardIds) {
      let resExpiredCard = await expiredCards.where({
        cardId: expiredCardId
      }).get();
      expiredCardList.push(resExpiredCard.data);
    }
    // 3.3打印查询成功
    console.log("查询成功", JSON.stringify(expiredCardList, null, 2));
  }else{
    // 3.4打印查询失败
    console.log("查询失败", JSON.stringify(res, null, 2));
  }

  // 4.返回数据
  return {
    expiredCardList,
    expiredCardNum: expiredCardList.length
  }
}