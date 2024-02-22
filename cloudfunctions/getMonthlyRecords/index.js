// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
// 0、获取数据库表
const db = cloud.database();
const monthlyCourseRecords = db.collection('monthlyCourseRecords');

// 云函数入口函数
exports.main = async (event, context) => {
  let thisMonthRescordList=[];
  let thisMonthRescordNum=0;
  // 1.获取此月（2024.2形式）
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const thisMonth = year + '.' + month;

  // 2.获取openid
  const openid = cloud.getWXContext().OPENID;

  // 3.利用openid 和 thisMonth 查询monthlyCourseRecords表
  let res = await monthlyCourseRecords.where({
    _openid: openid,
    month: thisMonth
  }).field({
    courseRecords: true
  }).get();

  // 4.判断是否查询成功
  if(res.data.length>0){
    console.log("查询成功",JSON.stringify(res.data[0],null,2));
    thisMonthRescordList=res.data[0].courseRecords;
    thisMonthRescordNum=thisMonthRescordList.length;
  }else{
    console.log("查询失败",JSON.stringify(res,null,2));
  }

  // 5.返回数据
  return {
    thisMonthRescordList,
    thisMonthRescordNum
  }
}