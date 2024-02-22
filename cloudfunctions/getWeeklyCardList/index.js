// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 0.user、weeklyCards表
const db = cloud.database();
const user = db.collection('user');
const weeklyCards = db.collection('weeklyCards');

// 云函数入口函数
exports.main = async (event, context) => {
  // 1.openid、初始化返回数据
  let weeklyCardList=[];
  let weeklyCardNum=0;
  const openid = cloud.getWXContext().OPENID;

  // 2.查询user表获取weeklyCardIds
  let res = await user.where({
    _openid: openid
  }).field({
    weeklyCardIds: true
  }).get();

  // 3.判断是否查询成功
  if (res.data.length > 0) {
    // 3.1获取weeklyCardIds
    let weeklyCardIds = res.data[0].weeklyCardIds;
    // 3.2遍历weeklyCardIds，获取weeklyCardList
    for (let weeklyCardId of weeklyCardIds) {
      let resWeeklyCard = await weeklyCards.where({
        cardId: weeklyCardId
      }).get();
      weeklyCardList.push(resWeeklyCard.data);
    }
    // 3.3打印查询成功
    console.log("查询成功", JSON.stringify(weeklyCardList, null, 2));
  }else{
    // 3.4打印查询失败
    console.log("查询失败", JSON.stringify(res, null, 2));
  }

  // 4.返回数据
  weeklyCardNum=weeklyCardList.length;
  return {
    weeklyCardList,
    weeklyCardNum
  }
}