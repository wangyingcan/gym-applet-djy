// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 1.获取数据库
const db=cloud.database();
const courseTable=db.collection('CourseTable');
const _=db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  // 1.获取参数
  const date=event.date
  console.log("从event中获取的date是",date)

  await courseTable.where({
    date:date
  }).update({
    data: {
      'courses.$[].cardId':"",
      'courses.$[].cardType':"",
      'courses.$[].firstBook':false
    }
  }).then(res => {
    console.log('courseTable更新成功', res)
  }).catch(err => {
    console.log('courseTable更新失败', err)
  })
}