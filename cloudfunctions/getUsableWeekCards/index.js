// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
// 0.获取user表、weeklyCards表
const db = cloud.database();
const user = db.collection('user');
const weekCard = db.collection('weeklyCards');

// 返回可用的月卡列表（约课界面初始化的时候就加载）
exports.main = async (event, context) => {
  // 1.初始化返回数据、openid
  const openid = cloud.getWXContext().OPENID;
  let usableWeekCards = [];

  // 2.读取user表中的weeklyCardIds
  let res = await user.where({
    _openid: openid
  }).field({
    weeklyCardIds: true
  }).get();

  // 3.判断是否查询成功
  if (res.data.length > 0) {
    // 3.1获取weeklyCardIds
    let weeklyCardIds = res.data[0].weeklyCardIds;
    // 3.2遍历weeklyCardIds，获取usableWeekCards
    for (let weeklyCardId of weeklyCardIds) {
      let resWeeklyCard = await weekCard.where({
        cardId: weeklyCardId
      }).get();
      // 3.3检查status，active和inactive可用
      if (((resWeeklyCard.data[0].status === "active")&&(resWeeklyCard.data[0].totalBookCount>0)&&(resWeeklyCard.data[0].remainingBookCount>0)) || resWeeklyCard.data[0].status === "inactive") {
        usableWeekCards.push(resWeeklyCard.data[0]);
      }
    }
    // 3.4打印查询成功
    console.log("查询成功", JSON.stringify(usableWeekCards, null, 2));
  } else {
    // 3.5打印查询失败
    console.log("查询失败", JSON.stringify(res, null, 2));
  }

  // 4.返回数据
  return {
    usableWeekCards,
    usableWeekCardNum: usableWeekCards.length
  }

}