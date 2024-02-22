// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 0.user、monthlyCards表
const db = cloud.database();
const user = db.collection('user');
const monthlyCards = db.collection('monthlyCards');

// 云函数入口函数
exports.main = async (event, context) => {
  // 1.openid、初始化返回数据
  let monthlyCardList=[];
  let monthlyCardNum=0;
  const openid = cloud.getWXContext().OPENID;

  // 2.查询user表获取monthlyCardIds
  let res = await user.where({
    _openid: openid
  }).field({
    monthlyCardIds: true
  }).get();

  // 3.判断是否查询成功
  if (res.data.length > 0) {
    // 3.1获取monthlyCardIds
    let monthlyCardIds = res.data[0].monthlyCardIds;
    // 3.2遍历monthlyCardIds，获取monthlyCardList
    for (let monthlyCardId of monthlyCardIds) {
      let resMonthlyCard = await monthlyCards.where({
        cardId: monthlyCardId
      }).get();
      monthlyCardList.push(resMonthlyCard.data);
    }
    // 3.3打印查询成功
    console.log("查询成功", JSON.stringify(monthlyCardList, null, 2));
  }else{
    // 3.4打印查询失败
    console.log("查询失败", JSON.stringify(res, null, 2));
  }

  // 4.返回数据
  monthlyCardNum=monthlyCardList.length;
  return {
    monthlyCardList,
    monthlyCardNum
  }
}