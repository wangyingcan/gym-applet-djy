// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
// 0.获取user表、monthCard表
const db = cloud.database();
const user = db.collection('user');
const monthCard = db.collection('monthlyCards');

// 返回可用的月卡列表（约课界面初始化的时候就加载）
exports.main = async (event, context) => {
  // 1.初始化返回数据、openid
  const openid = cloud.getWXContext().OPENID;
  let usableMonthCards = [];

  // 2.读取user表中的monthlyCardIds
  let res = await user.where({
    _openid: openid
  }).field({
    monthlyCardIds: true
  }).get();

  // 3.判断是否查询成功
  if (res.data.length > 0) {
    // 3.1获取monthlyCardIds
    let monthlyCardIds = res.data[0].monthlyCardIds;
    // 3.2遍历monthlyCardIds，获取usableMonthCards
    for (let monthlyCardId of monthlyCardIds) {
      let resMonthlyCard = await monthCard.where({
        cardId: monthlyCardId
      }).get();
      // 3.3检查status，active和inactive可用同时检查active卡的remainingBookCount是否为1
      if (((resMonthlyCard.data[0].status === "active")&&(resMonthlyCard.data[0].remainingBookCount>0)) || resMonthlyCard.data[0].status === "inactive") {
        usableMonthCards.push(resMonthlyCard.data[0]);
      }
    }
    // 3.4打印查询成功
    console.log("查询成功", JSON.stringify(usableMonthCards, null, 2));
  } else {
    // 3.5打印查询失败
    console.log("查询失败", JSON.stringify(res, null, 2));
  }

  // 4.返回数据
  return {
    usableMonthCards,
    usableMonthCardNum: usableMonthCards.length
  }

}