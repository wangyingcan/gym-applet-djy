// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 1.获取数据库表
const db = cloud.database();
const monthlyCards = db.collection('monthlyCards');
const weeklyCards = db.collection('weeklyCards');

// 云函数入口函数
exports.main = async (event, context) => {
  // 更新所有active、paused状态的月卡
  // await monthlyCards.where({
  //   status: "active"
  // }).update({
  //   data: {
  //     remainingBookCount: 1
  //   }
  // }).then(res => {
  //   console.log("22点active月卡更新成功")
  // }).catch(err => {
  //   console.log("22点active月卡更新失败")
  // });

  await monthlyCards.where({
    status: "paused"
  }).update({
    data: {
      remainingBookCount: 1
    }
  }).then(res => {
    console.log("22点paused月卡更新成功")
  }).catch(err => {
    console.log("22点paused月卡更新失败")
  });

  // 更新所有active状态的周卡
  await weeklyCards.where({
    status: "active"
  }).update({
    data: {
      remainingBookCount: 2
    }
  }).then(res => {
    console.log("22点active周卡更新成功")
  }).catch(err => {
    console.log("22点active周卡更新失败")
  });
}