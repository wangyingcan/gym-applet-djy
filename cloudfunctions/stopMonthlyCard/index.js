// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 1.monthlyCards表
const db = cloud.database();
const monthlyCards = db.collection('monthlyCards');

// 云函数入口函数(云函数参数cardId)
exports.main = async (event, context) => {
  // 1.获取参数
  const cardId = event.cardId;

  // 2.找到记录并修改status和pauseStart、hasPaused
  await monthlyCards.where({
    cardId: cardId
  }).update({
    data: {
      hasPaused: true,
      status: "paused",
      pauseStart: new Date().getFullYear() + '.' + (new Date().getMonth() + 1) + '.' + new Date().getDate()

    }
  }).then(res => {
    console.log("暂停月卡成功", JSON.stringify(res, null, 2))
  }).catch(err => {
    console.log("暂停月卡失败", JSON.stringify(err, null, 2))
  });
}